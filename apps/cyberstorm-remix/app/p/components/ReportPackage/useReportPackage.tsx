import { useCallback, useEffect, useState } from "react";

import { type RequestConfig } from "@thunderstore/thunderstore-api";

import { ReportPackageButton } from "./ReportPackageButton";
import {
  ReportPackageForm,
  type ReportPackageFormProps,
  type ReportPackageFormState,
} from "./ReportPackageForm";
import { ReportPackageModal } from "./ReportPackageModal";
import { ReportPackageSubmitted } from "./ReportPackageSubmitted";

const createInitialFormInputs = (
  defaultVersion?: string
): ReportPackageFormState => ({
  reason: null,
  description: "",
  // Only seed a version when we actually have one; an empty string would pass
  // the schema but be rejected by the backend's semver parsing.
  ...(defaultVersion ? { version: defaultVersion } : {}),
});

export function useReportPackage(formProps: {
  formPropsPromise: Promise<ReportPackageFormProps>;
  config: () => RequestConfig;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formInputs, setFormInputs] = useState<ReportPackageFormState>(
    createInitialFormInputs
  );

  const onOpenChange = (isOpen: boolean) => {
    setIsOpen(isOpen);
    setIsSubmitted(false);
    setError(null);
  };

  type UpdateFormInput = <K extends keyof ReportPackageFormState>(
    field: K,
    value: ReportPackageFormState[K]
  ) => void;

  const updateFormInput = useCallback<UpdateFormInput>((field, value) => {
    setFormInputs((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const [props, setProps] = useState<ReportPackageFormProps | null>(null);

  // Reseed the default version on reset so reopening the modal (after a submit
  // or cancel) defaults to the current version again instead of an empty select.
  const resetFormInputs = useCallback(() => {
    setFormInputs(createInitialFormInputs(props?.defaultVersion));
  }, [props?.defaultVersion]);

  async function awaitAndSetProps() {
    if (!props) {
      const resolved = await formProps.formPropsPromise;
      setProps(resolved);
      // Preselect the version the user has open once the version list resolves,
      // but only if we have a real version and the user hasn't picked one yet.
      setFormInputs((prev) =>
        prev.version || !resolved.defaultVersion
          ? prev
          : { ...prev, version: resolved.defaultVersion }
      );
    }
  }

  useEffect(() => {
    awaitAndSetProps();
  }, [formProps, props, awaitAndSetProps]);

  const button = <ReportPackageButton onClick={() => onOpenChange(true)} />;

  const extraProps = {
    error,
    onOpenChange,
    setError,
    setIsSubmitted,
    formInputs,
    updateFormInput,
    resetFormInputs,
  };
  const form = props && (
    <ReportPackageForm {...props} {...extraProps} config={formProps.config} />
  );

  const done = (
    <ReportPackageSubmitted closeModal={() => onOpenChange(false)} />
  );

  const modal = (
    <ReportPackageModal {...{ isOpen, onOpenChange }}>
      {isSubmitted ? done : form}
    </ReportPackageModal>
  );

  return {
    ReportPackageButton: button,
    ReportPackageModal: modal,
  };
}
