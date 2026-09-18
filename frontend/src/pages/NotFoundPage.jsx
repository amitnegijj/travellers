import { NotFoundBlock } from "../components/not-found.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

export function NotFoundPage() {
  useDocumentTitle("Not found");
  return <NotFoundBlock />;
}
