import {
  faCheck,
  faClone,
  faDownload,
  faExpand,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { stripHtmlTags } from "cyberstorm/utils/HTMLParsing";
import { memo, useMemo, useState } from "react";

import {
  CodeBox,
  Modal,
  NewAlert,
  NewButton,
  NewIcon,
} from "@thunderstore/cyberstorm";

import "./CodeBoxHTML.css";

export interface CodeBoxHTMLProps {
  value?: string;
  maxHeight?: number;
  language?: string;
  /** When set, a download button labelled with the file ending is shown. */
  downloadUrl?: string;
}

/** Derive a leading-dot file ending (e.g. ".blob") from a download URL. */
function fileEndingFromUrl(url?: string): string | null {
  if (!url) return null;
  try {
    const segment = new URL(url, "https://localhost").pathname.split("/").pop();
    const dot = segment ? segment.lastIndexOf(".") : -1;
    return dot > 0 ? (segment as string).slice(dot) : null;
  } catch {
    return null;
  }
}

/** Copy-to-clipboard button styled to match the other toolbar icon buttons. */
function ToolbarCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = () => {
    void navigator?.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <NewButton
      csVariant="secondary"
      csSize="small"
      csModifiers={["only-icon"]}
      tooltipText={copied ? "Copied!" : "Copy"}
      aria-label="Copy code"
      onClick={onCopy}
    >
      <NewIcon csMode="inline" noWrapper>
        <FontAwesomeIcon icon={copied ? faCheck : faClone} />
      </NewIcon>
    </NewButton>
  );
}

/**
 * CodeBox component which renders HTML content by stripping HTML tags
 * and passing the plain text to the CodeBox component for syntax highlighting.
 *
 * Renders a non-ghost toolbar (copy first, optional download labelled with the
 * file ending, then expand) and an Expand control that opens the code in a
 * modal sliding up from the bottom of the viewport, inset from the top/bottom
 * edges on non-mobile widths.
 */
export const CodeBoxHTML = memo(function CodeBoxHTML({
  value = "",
  maxHeight = 600,
  language = "text",
  downloadUrl,
}: CodeBoxHTMLProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const result = useMemo(() => {
    try {
      const text = stripHtmlTags(value);
      return { text, error: null };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to process HTML content";
      return { text: "", error: errorMessage };
    }
  }, [value]);

  if (result.error) {
    return <NewAlert csVariant="danger">{result.error}</NewAlert>;
  }

  const fileEnding = fileEndingFromUrl(downloadUrl);

  const renderToolbar = (includeExpand: boolean, rootClass: string) => (
    <div className={rootClass}>
      <ToolbarCopyButton text={result.text} />
      {downloadUrl ? (
        <NewButton
          csVariant="secondary"
          csSize="small"
          primitiveType="link"
          href={downloadUrl}
          tooltipText="Download"
          aria-label="Download file"
        >
          <NewIcon csMode="inline" noWrapper>
            <FontAwesomeIcon icon={faDownload} />
          </NewIcon>
          {fileEnding ?? "Download"}
        </NewButton>
      ) : null}
      {includeExpand ? (
        <NewButton
          csVariant="secondary"
          csSize="small"
          csModifiers={["only-icon"]}
          tooltipText="Expand"
          aria-label="Expand code to fullscreen"
          onClick={() => setIsFullscreen(true)}
        >
          <NewIcon csMode="inline" noWrapper>
            <FontAwesomeIcon icon={faExpand} />
          </NewIcon>
        </NewButton>
      ) : null}
    </div>
  );

  return (
    <div className="code-box-html__container">
      {renderToolbar(true, "code-box-html__toolbar")}

      <div
        className="code-box-html"
        style={{
          maxHeight,
          width: "100%",
          overflow: "auto",
        }}
      >
        <CodeBox
          value={result.text}
          language={language}
          showLineNumbers
          allowCopy={false}
        />
      </div>

      <Modal
        open={isFullscreen}
        onOpenChange={setIsFullscreen}
        disableDefaultSubComponents
        contentClasses="code-box-html__fullscreen"
      >
        <Modal.Title className="code-box-html__sr-only">
          Code viewer
        </Modal.Title>
        <Modal.Exit />
        {/* Expand is omitted here (already expanded); the toolbar is offset to
            clear the modal's close button. */}
        {renderToolbar(false, "code-box-html__fullscreen-toolbar")}
        <div className="code-box-html__fullscreen-inner">
          <CodeBox
            value={result.text}
            language={language}
            showLineNumbers
            allowCopy={false}
          />
        </div>
      </Modal>
    </div>
  );
});

CodeBoxHTML.displayName = "CodeBoxHTML";
