import { createBrowserRouter } from "react-router";
import { HomeScreen } from "./screens/HomeScreen";
import { CameraScreen } from "./screens/CameraScreen";
import { LoadingScreen } from "./screens/LoadingScreen";
import { ResultScreen } from "./screens/ResultScreen";
import { GuideScreen } from "./screens/GuideScreen";
import { HistoryScreen } from "./screens/HistoryScreen";
import { StainRemovalScreen } from "./screens/StainRemoveScreen";
import { ChatbotScreen } from "./screens/ChatbotScreen";

export const router = createBrowserRouter([
  { path: "/", Component: HomeScreen },
  { path: "/camera", Component: CameraScreen },
  { path: "/loading", Component: LoadingScreen },
  { path: "/result", Component: ResultScreen },
  { path: "/guide", Component: GuideScreen },
  { path: "/history", Component: HistoryScreen },
  { path: "/stain", Component: StainRemovalScreen },
  { path: "/chatbot", Component: ChatbotScreen },
]);