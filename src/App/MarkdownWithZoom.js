import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
const React = NEXUS.libraries.React;

// Helper: Group images for flex display
const FlexImageGroup = ({ children }) => (
  <div style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: "16px", // space between images
    flexWrap: "wrap",
    margin: "16px 0"
  }}>
    {children}
  </div>
);

// Track if we're rendering a group of images (naive: two or more images in a paragraph)
function MarkdownWithZoom({ children }) {
  const [modalImg, setModalImg] = React.useState(null);

  function Img({ src, alt }) {
    return (
      <img
        src={src}
        alt={alt}
        style={{
          maxWidth: 200,
          maxHeight: 120,
          cursor: "pointer",
          border: "1px solid #888",
          borderRadius: "4px",
          background: "#222",
          margin: "1em"
        }}
        onClick={() => setModalImg(src)}
      />
    );
  }

  // Custom paragraph renderer to wrap consecutive images in a flexbox
  function Paragraph({ children }) {
    const arrayed = React.Children.toArray(children);
    // Now it's always an array, safe to call .every()
    if (
      arrayed.length > 0 &&
      arrayed.every(
        child =>
          (child?.type === "img") ||
          (child?.props && child.props.src)
      )
    ) {
      // ...your flex container here
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            gap: "16px",
            flexWrap: "wrap",
            margin: "16px 0"
          }}
        >
          {arrayed}
        </div>
      );
    }
    return <p>{children}</p>;
  }

  return (
    <>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          img: Img,
          p: Paragraph
        }}
      >
        {children}
      </ReactMarkdown>
      {/* Modal overlay for zoom */}
      {modalImg && (
        <div
          onClick={() => setModalImg(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 9999,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer"
          }}
        >
          <img
            src={modalImg}
            alt=""
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              boxShadow: "0 0 32px #000",
              border: "2px solid white",
              background: "#222",
              borderRadius: "8px",
            }}
          />
        </div>
      )}
    </>
  );
}

export default MarkdownWithZoom;