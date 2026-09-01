"use client";

import { Children, cloneElement, forwardRef, useId } from "react";
import type {
  InputHTMLAttributes,
  ReactElement,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { useFormContext } from "react-hook-form";
import type { FieldValues, RegisterOptions } from "react-hook-form";

type FormControlProps = {
  id?: string;
  name?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

export function Field({
  name,
  label,
  hint,
  children,
  rules,
  required,
}: {
  name: string;
  label: string;
  hint?: string;
  children: ReactElement<FormControlProps>;
  rules?: RegisterOptions<FieldValues>;
  required?: boolean;
}) {
  const generatedId = useId();
  const form = useFormContext<FieldValues>();
  const state = form.getFieldState(name, form.formState);
  const control = Children.only(children);
  const controlId = control.props.id ?? generatedId;
  const hintId = hint ? `${generatedId}-hint` : undefined;
  const errorId = state.error ? `${generatedId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const registration = form.register(name, rules);

  return (
    <div className="ui-field">
      <label className="ui-field__label" htmlFor={controlId}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {cloneElement(control, {
        ...registration,
        ...control.props,
        id: controlId,
        name,
        "aria-invalid": state.invalid || undefined,
        "aria-describedby": describedBy,
      })}
      {hint ? (
        <span className="ui-field__hint" id={hintId}>
          {hint}
        </span>
      ) : null}
      {state.error?.message ? (
        <span className="ui-field__error" id={errorId} role="alert">
          <span aria-hidden="true">!</span>
          {String(state.error.message)}
        </span>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = "", ...props }, ref) {
    return <input {...props} ref={ref} className={`ui-control ${className}`.trim()} />;
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className = "", ...props }, ref) {
  return <textarea {...props} ref={ref} className={`ui-control ui-textarea ${className}`.trim()} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className = "", children, ...props }, ref) {
    return (
      <span className="ui-select-wrap">
        <select {...props} ref={ref} className={`ui-control ui-select ${className}`.trim()}>
          {children}
        </select>
        <span className="ui-select__mark" aria-hidden="true">
          ⌄
        </span>
      </span>
    );
  },
);
