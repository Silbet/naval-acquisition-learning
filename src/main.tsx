import React from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  createHashRouter,
  RouterProvider,
} from "react-router-dom";
import App from "./App";
import "./styles.css";
// Pages는 하위 경로의 SPA fallback을 지원하지 않으므로 해시 라우터를 사용합니다.
const createRouter =
  import.meta.env.MODE === "pages" ? createHashRouter : createBrowserRouter;
const router = createRouter([{ path: "*", element: <App /> }]);
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
