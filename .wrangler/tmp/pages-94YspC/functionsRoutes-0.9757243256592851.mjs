import { onRequestOptions as __api_create_payment_intent_js_onRequestOptions } from "C:\\Users\\The Hub\\.gemini\\antigravity\\scratch\\funnel-builder\\functions\\api\\create-payment-intent.js"
import { onRequestPost as __api_create_payment_intent_js_onRequestPost } from "C:\\Users\\The Hub\\.gemini\\antigravity\\scratch\\funnel-builder\\functions\\api\\create-payment-intent.js"
import { onRequestPost as __create_payment_intent_js_onRequestPost } from "C:\\Users\\The Hub\\.gemini\\antigravity\\scratch\\funnel-builder\\functions\\create-payment-intent.js"

export const routes = [
    {
      routePath: "/api/create-payment-intent",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_create_payment_intent_js_onRequestOptions],
    },
  {
      routePath: "/api/create-payment-intent",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_create_payment_intent_js_onRequestPost],
    },
  {
      routePath: "/create-payment-intent",
      mountPath: "/",
      method: "POST",
      middlewares: [],
      modules: [__create_payment_intent_js_onRequestPost],
    },
  ]