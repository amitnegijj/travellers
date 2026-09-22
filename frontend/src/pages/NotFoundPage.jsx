import { NotFoundBlock } from "../components/NotFound.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.jsx";

export function NotFoundPage() {
  useDocumentTitle("Not found");
  return <NotFoundBlock />;
}
