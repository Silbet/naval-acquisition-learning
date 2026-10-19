import settings from "./feedback-settings.json";

export function feedbackForm(formId: string) {
  // Only a public form ID is needed. Never put an account/API token here.
  const id = formId.trim();
  if (!/^[a-zA-Z0-9]+$/.test(id)) return null;
  return {
    publicUrl: `https://tally.so/r/${id}`,
    embedUrl: `https://tally.so/embed/${id}?alignLeft=1&hideTitle=1&transparentBackground=1`,
  };
}

export const configuredFeedbackForm = feedbackForm(
  import.meta.env.VITE_TALLY_FORM_ID ?? settings.tallyFormId,
);
