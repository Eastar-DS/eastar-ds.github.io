import { useId } from "react";

import { CSS_PROPERTIES } from "@/modules/features/demo/RenderingPipelineDemo/constants/pipeline";
import type { CssPropertyId } from "@/modules/features/demo/RenderingPipelineDemo/types/pipeline";

import styles from "./PropertyPicker.module.css";

interface PropertyPickerProps {
  value: CssPropertyId;
  onChange: (propertyId: CssPropertyId) => void;
}

/** 바꿀 CSS 속성을 고르는 단추 묶음입니다. 라디오 버튼이라 방향키로도 고를 수 있습니다 */
export default function PropertyPicker({ value, onChange }: PropertyPickerProps) {
  const name = useId();

  return (
    <fieldset className={styles.container}>
      <legend className="visually-hidden">바꿀 CSS 속성</legend>
      {CSS_PROPERTIES.map((property) => (
        <label key={property.id} className={styles.option}>
          <input
            type="radio"
            className={styles.input}
            name={name}
            value={property.id}
            checked={value === property.id}
            onChange={() => onChange(property.id)}
          />
          <span className={styles.text}>{property.id}</span>
        </label>
      ))}
    </fieldset>
  );
}
