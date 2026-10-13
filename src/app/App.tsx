import { PwaProvider } from "./core/pwa/PwaProvider";
import { AppRouter } from "./core/router/AppRouter";

export function App() {
  return <PwaProvider><AppRouter /></PwaProvider>;
}
