import type {
  CommentCreateResponse,
  CommentField,
  CommentItem,
  CommentListResponse,
  ReplyItem,
} from "@/modules/widgets/post/Comments/types/comment";
import { CONTENT_MAX_LENGTH } from "@/modules/widgets/post/Comments/constants/commentLimits";
import formatCommentTime from "@/modules/widgets/post/Comments/utils/formatCommentTime";
import getTurnstileTheme from "@/modules/widgets/post/Comments/utils/getTurnstileTheme";
import toCommentErrorMessage from "@/modules/widgets/post/Comments/utils/toCommentErrorMessage";
import toCommentsUrl from "@/modules/widgets/post/Comments/utils/toCommentsUrl";
import validateCommentDraft from "@/modules/widgets/post/Comments/utils/validateCommentDraft";

interface TurnstileApi {
  render: (container: HTMLElement, options: Record<string, unknown>) => string | null | undefined;
  reset: (widgetId: string) => void;
}

interface TokenWaiter {
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}

// Turnstile은 Cloudflare 주소에서 직접 불러와야 합니다(복사해 두거나 중계하면 안 됨)
const TURNSTILE_SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
// 스팸 확인 토큰을 기다리는 시간. 넘으면 다시 남겨 달라고 안내합니다
const TOKEN_TIMEOUT_MS = 15000;

const getTurnstile = () => (window as Window & { turnstile?: TurnstileApi }).turnstile;

/**
 * 댓글 칸을 움직이게 합니다: 목록을 불러와 그리고, 답글 대상 고르기 · 쓰기 · Turnstile을 맡습니다.
 * 댓글 칸이 화면 가까이 왔을 때 CommentSection의 스크립트가 이 파일을 동적 import로 받아 부릅니다.
 * 그래서 이 코드는 글 페이지를 처음 열 때 받지 않습니다.
 * - 댓글은 HTML이 아닌 글(textContent)로만 그려서, 링크도 누를 수 없는 글로 보입니다.
 * - Turnstile 스크립트는 목록을 그린 뒤 쓰기 칸이 화면에 들어오거나 쓰기 칸에 포커스가 갈 때만 불러옵니다.
 * 판단 로직은 utils에 두고 단위 테스트합니다.
 */
const mountComments = (root: HTMLElement) => {
  const workerUrl = root.dataset.workerUrl ?? "";
  const postPath = root.dataset.postPath ?? "";
  const siteKey = root.dataset.turnstileSiteKey ?? "";
  const pick = <T extends Element>(selector: string) => root.querySelector<T>(selector);

  const count = pick<HTMLElement>("[data-comments-count]");
  const placeholder = pick<HTMLElement>("[data-comments-placeholder]");
  const loadStatus = pick<HTMLElement>("[data-comments-load-status]");
  const retryButton = pick<HTMLButtonElement>("[data-comments-retry]");
  const list = pick<HTMLOListElement>("[data-comments-list]");
  const empty = pick<HTMLElement>("[data-comments-empty]");
  const approvalNote = pick<HTMLElement>("[data-comments-approval]");
  const template = pick<HTMLTemplateElement>("[data-comment-template]");
  const form = pick<HTMLFormElement>("[data-comment-form]");
  const nicknameInput = pick<HTMLInputElement>("#comment-nickname");
  const contentInput = pick<HTMLTextAreaElement>("#comment-content");
  const homepageInput = pick<HTMLInputElement>("#comment-homepage");
  const counter = pick<HTMLElement>("[data-comment-counter]");
  const replyBox = pick<HTMLElement>("[data-comment-reply]");
  const replyText = pick<HTMLElement>("[data-comment-reply-text]");
  const replyCancel = pick<HTMLButtonElement>("[data-comment-reply-cancel]");
  const turnstileBox = pick<HTMLElement>("[data-comment-turnstile]");
  const submitButton = pick<HTMLButtonElement>("[data-comment-submit]");
  const formStatus = pick<HTMLElement>("[data-comment-status]");

  if (
    !count || !placeholder || !loadStatus || !retryButton || !list || !empty || !approvalNote || !template ||
    !form || !nicknameInput || !contentInput || !homepageInput || !counter || !replyBox || !replyText ||
    !replyCancel || !turnstileBox || !submitButton || !formStatus
  ) {
    return;
  }

  let comments: CommentItem[] = [];
  let isListLoaded = false;
  let replyTarget: { id: string; nickname: string } | null = null;
  let isSending = false;
  let newCommentId = "";
  let turnstileScript: Promise<TurnstileApi> | null = null;
  let turnstileWidget: Promise<string | null> | null = null;
  let widgetId: string | null = null;
  let token = "";
  let tokenWaiters: TokenWaiter[] = [];

  // 목록 그리기 ------------------------------------------------------------

  const startReply = (item: CommentItem) => {
    replyTarget = { id: item.id, nickname: item.nickname };
    replyText.textContent = `「${item.nickname}」님의 댓글에 답글을 씁니다.`;
    replyBox.hidden = false;
    contentInput.focus();
  };

  const cancelReply = () => {
    replyTarget = null;
    replyBox.hidden = true;
    replyText.textContent = "";
  };

  const createCommentElement = (item: CommentItem | ReplyItem, isTopLevel: boolean): HTMLElement => {
    const fragment = template.content.cloneNode(true) as DocumentFragment;
    const element = fragment.firstElementChild as HTMLElement;
    const field = <T extends HTMLElement>(name: string) => element.querySelector<T>(`[data-field="${name}"]`);
    const time = field<HTMLTimeElement>("time");
    const replyButton = field<HTMLButtonElement>("reply");
    const replyList = field<HTMLOListElement>("replies");

    field("nickname")!.textContent = item.nickname;
    field("author")!.hidden = !item.isAuthor;
    field("content")!.textContent = item.content;
    if (time) {
      time.dateTime = item.createdAt;
      time.textContent = formatCommentTime(item.createdAt);
    }
    if (item.id === newCommentId) element.dataset.new = "true";

    if (isTopLevel && "replies" in item) {
      replyButton?.setAttribute("aria-label", `「${item.nickname}」님의 댓글에 답글 쓰기`);
      replyButton?.addEventListener("click", () => startReply(item));
      replyList?.replaceChildren(...item.replies.map((reply) => createCommentElement(reply, false)));
      if (replyList) replyList.hidden = item.replies.length === 0;
    } else {
      replyButton?.remove();
      replyList?.remove();
    }

    return element;
  };

  const renderList = () => {
    const total = comments.reduce((sum, comment) => sum + 1 + comment.replies.length, 0);

    list.replaceChildren(...comments.map((comment) => createCommentElement(comment, true)));
    list.hidden = comments.length === 0;
    empty.hidden = comments.length > 0;
    count.textContent = total > 0 ? ` ${total}` : "";
  };

  const loadComments = async () => {
    loadStatus.textContent = "댓글을 불러오는 중입니다.";
    retryButton.hidden = true;

    try {
      const response = await fetch(toCommentsUrl({ workerUrl, postPath }), { headers: { Accept: "application/json" } });

      if (!response.ok) throw new Error(`댓글 목록 ${response.status}`);

      const data = (await response.json()) as CommentListResponse;

      comments = data.comments;
      isListLoaded = true;
      approvalNote.hidden = data.moderation !== "approval";
      placeholder.hidden = true;
      renderList();
    } catch {
      loadStatus.textContent = "댓글을 불러오지 못했습니다. 잠시 뒤 다시 불러와 주세요.";
      retryButton.hidden = false;
    } finally {
      // 목록이 들어온 뒤라야 쓰기 칸의 자리가 정해지므로, 그때부터 쓰기 칸이 화면에 들어오는지 봅니다
      watchForm();
    }
  };

  // Turnstile ------------------------------------------------------------

  const settleWaiters = (result: { token: string } | { error: Error }) => {
    const waiters = tokenWaiters;

    tokenWaiters = [];
    waiters.forEach((waiter) => ("token" in result ? waiter.resolve(result.token) : waiter.reject(result.error)));
  };

  const loadTurnstileScript = () => {
    turnstileScript ??= new Promise<TurnstileApi>((resolve, reject) => {
      const loaded = getTurnstile();

      if (loaded) {
        resolve(loaded);
        return;
      }

      const script = document.createElement("script");

      script.src = TURNSTILE_SCRIPT_URL;
      script.async = true;
      script.addEventListener("load", () => {
        const turnstile = getTurnstile();

        if (turnstile) resolve(turnstile);
        else reject(new Error("turnstile_unavailable"));
      });
      script.addEventListener("error", () => {
        // 다음에 다시 불러올 수 있게 비웁니다
        turnstileScript = null;
        script.remove();
        reject(new Error("turnstile_unavailable"));
      });
      document.head.append(script);
    });

    return turnstileScript;
  };

  const prepareTurnstile = () => {
    turnstileWidget ??= loadTurnstileScript()
      .then((turnstile) => {
        widgetId =
          turnstile.render(turnstileBox, {
            sitekey: siteKey,
            action: "comment",
            language: "ko",
            theme: getTurnstileTheme(document.documentElement.dataset.theme),
            appearance: "interaction-only",
            size: "flexible",
            callback: (newToken: string) => {
              token = newToken;
              settleWaiters({ token: newToken });
            },
            "expired-callback": () => {
              token = "";
            },
            "error-callback": () => {
              token = "";
              settleWaiters({ error: new Error("turnstile_failed") });
            },
          }) ?? null;

        return widgetId;
      })
      .catch((error: unknown) => {
        turnstileWidget = null;
        throw error;
      });

    return turnstileWidget;
  };

  const prepareTurnstileQuietly = () => {
    prepareTurnstile().catch(() => {
      // 남기기를 누를 때 다시 해 보고, 그때 안내합니다
    });
  };

  // 토큰은 한 번만 쓸 수 있어서 꺼내면 비웁니다
  const takeToken = () =>
    new Promise<string>((resolve, reject) => {
      if (token) {
        const current = token;

        token = "";
        resolve(current);
        return;
      }

      const timer = window.setTimeout(() => {
        tokenWaiters = tokenWaiters.filter((waiter) => waiter !== tokenWaiter);
        reject(new Error("turnstile_timeout"));
      }, TOKEN_TIMEOUT_MS);
      const tokenWaiter: TokenWaiter = {
        resolve: (newToken) => {
          window.clearTimeout(timer);
          token = "";
          resolve(newToken);
        },
        reject: (error) => {
          window.clearTimeout(timer);
          reject(error);
        },
      };

      tokenWaiters.push(tokenWaiter);
    });

  const formObserver = new IntersectionObserver((entries, observer) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    prepareTurnstileQuietly();
  });
  const watchForm = () => formObserver.observe(form);

  // 쓰기 ------------------------------------------------------------

  const updateCounter = () => {
    counter.textContent = `${contentInput.value.length} / ${CONTENT_MAX_LENGTH}`;
  };

  const showStatus = (message: string, tone: "info" | "error" | "success") => {
    formStatus.textContent = message;
    formStatus.dataset.tone = tone;
  };

  // 오류가 난 칸은 aria-invalid와 함께 안내 줄(comment-status)을 설명으로 잇습니다
  const markInvalid = (field: CommentField | null) => {
    nicknameInput.removeAttribute("aria-invalid");
    nicknameInput.removeAttribute("aria-describedby");
    contentInput.removeAttribute("aria-invalid");
    contentInput.setAttribute("aria-describedby", "comment-counter");

    if (field === "nickname") {
      nicknameInput.setAttribute("aria-invalid", "true");
      nicknameInput.setAttribute("aria-describedby", "comment-status");
      nicknameInput.focus();
    }
    if (field === "content") {
      contentInput.setAttribute("aria-invalid", "true");
      contentInput.setAttribute("aria-describedby", "comment-counter comment-status");
      contentInput.focus();
    }
  };

  const showError = (code: string | undefined) => {
    const { message, field } = toCommentErrorMessage(code);

    showStatus(message, "error");
    markInvalid(field);
  };

  const setSending = (nextIsSending: boolean) => {
    isSending = nextIsSending;
    submitButton.setAttribute("aria-disabled", String(nextIsSending));
    submitButton.textContent = nextIsSending ? "남기는 중" : "댓글 남기기";
  };

  const handleCreated = (created: CommentCreateResponse, draft: { nickname: string; content: string }) => {
    if (created.status === "published" && isListLoaded) {
      const item: ReplyItem = {
        id: created.id,
        nickname: draft.nickname,
        content: draft.content,
        createdAt: new Date().toISOString(),
        isAuthor: false,
      };
      const parent = replyTarget ? comments.find((comment) => comment.id === replyTarget?.id) : undefined;

      if (parent) parent.replies.push(item);
      else comments.push({ ...item, replies: [] });
      newCommentId = created.id;
      renderList();
    } else if (created.status === "published") {
      void loadComments();
    }

    showStatus(
      created.status === "published" ? "댓글을 남겼습니다." : "댓글을 남겼습니다. 이스타가 확인한 뒤 보입니다.",
      "success",
    );
    contentInput.value = "";
    updateCounter();
    cancelReply();
    markInvalid(null);
  };

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    if (isSending) return;

    const nickname = nicknameInput.value.trim();
    const content = contentInput.value.trim();
    const draftError = validateCommentDraft({ nickname, content });

    if (draftError) {
      showError(draftError);
      return;
    }

    setSending(true);
    showStatus("댓글을 남기는 중입니다.", "info");

    try {
      await prepareTurnstile();

      const turnstileToken = await takeToken();
      const response = await fetch(toCommentsUrl({ workerUrl }), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postPath,
          nickname,
          content,
          parentId: replyTarget?.id ?? null,
          turnstileToken,
          homepage: homepageInput.value,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as Partial<CommentCreateResponse> & { error?: string };

      if (!response.ok || !data.id || !data.status) {
        showError(data.error);
        return;
      }

      handleCreated({ id: data.id, status: data.status }, { nickname, content });
    } catch (error) {
      showError(error instanceof Error && error.message.startsWith("turnstile") ? "turnstile_failed" : "network_error");
    } finally {
      setSending(false);
      token = "";
      if (widgetId) getTurnstile()?.reset(widgetId);
    }
  };

  // 시작 ------------------------------------------------------------

  void loadComments();
  form.addEventListener("focusin", prepareTurnstileQuietly, { once: true });
  form.addEventListener("submit", handleSubmit);
  contentInput.addEventListener("input", updateCounter);
  replyCancel.addEventListener("click", () => {
    cancelReply();
    contentInput.focus();
  });
  retryButton.addEventListener("click", () => void loadComments());
};

export default mountComments;
