import { createFileRoute } from "@tanstack/react-router";
import { ASLNeuralLibrary } from "@/components/ASLNeuralLibrary";

export const Route = createFileRoute("/asl-library")({
  head: () => ({
    meta: [
      { title: "ASL Neural Library — Silent Talk" },
      {
        name: "description",
        content: "Explore the hand-language patterns recognized by Silent Talk.",
      },
      { property: "og:title", content: "ASL Neural Library — Silent Talk" },
      {
        property: "og:description",
        content: "An interactive visual reference for the ASL alphabet gestures.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ASLNeuralLibraryPage,
});

function ASLNeuralLibraryPage() {
  return <ASLNeuralLibrary />;
}
