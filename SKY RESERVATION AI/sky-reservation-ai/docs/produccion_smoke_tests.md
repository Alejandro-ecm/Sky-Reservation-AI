# Smoke Tests de Producción — Sky Reservation AI
**Versión:** 1.0 | **Fecha:** 2026-06-02 | **Entorno objetivo:** Vercel Production

> Ejecutar **en orden** tras el primer deploy exitoso. Cada test valida un path de seguridad crítico.
> Reemplaza `$BASE_URL` con la URL de producción (ej. `https://sky-reservation-ai.vercel.app`).

---

## Variables de Entorno para los Tests

```bash
export BASE_URL="https://sky-reservation-ai.vercel.app"
export VAPI_SECRET="tu_valor_de_VAPI_WEBHOOK_SECRET"
export STRIPE_WEBHOOK_SECRET="tu_valor_de_STRIPE_WEBHOOK_SECRET"
export META_VERIFY_TOKEN="tu_valor_de_META_WEBHOOK_VERIFY_TOKEN"
```

---

## 1. VAPI Webhook

### 1.1 Sin secret → 401 Unauthorized
```bash
curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE_URL/api/vapi/webhook" \
  -H "Content-Type: application/json" \
  -d '{"message": {"type": "status-update", "status": "started"}}'
# Esperado: 401
```

### 1.2 Secret inválido → 401 Unauthorized
```bash
curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE_URL/api/vapi/webhook" \
  -H "Content-Type: application/json" \
  -H "x-vapi-secret: secreto_incorrecto_12345" \
  -d '{"message": {"type": "status-update", "status": "started"}}'
# Esperado: 401
# Verificar en Vercel Logs: event=INVALID_SECRET, service=vapi-webhook
```

### 1.3 Secret válido + evento desconocido → 200 OK
```bash
curl -s -w "\n%{http_code}" \
  -X POST "$BASE_URL/api/vapi/webhook" \
  -H "Content-Type: application/json" \
  -H "x-vapi-secret: $VAPI_SECRET" \
  -d '{"message": {"type": "unknown-event-type"}}'
# Esperado: 200 {"received":true}
```

### 1.4 Secret válido + end-of-call-report → 200 OK
```bash
curl -s -w "\n%{http_code}" \
  -X POST "$BASE_URL/api/vapi/webhook" \
  -H "Content-Type: application/json" \
  -H "x-vapi-secret: $VAPI_SECRET" \
  -d '{
    "message": {
      "type": "end-of-call-report",
      "call": {
        "id": "smoke-test-call-001",
        "assistantId": "asst_smoke_test",
        "durationSeconds": 65,
        "endedReason": "customer-ended-call",
        "customer": { "number": "+5491100000000" }
      },
      "artifact": {
        "transcript": "Usuario: Hola\nAsistente: Hola, ¿en qué puedo ayudarte?",
        "summary": "Llamada de prueba de smoke test",
        "messages": [
          { "role": "user", "content": "Hola", "time": 1748822400000 },
          { "role": "assistant", "content": "Hola, ¿en qué puedo ayudarte?", "time": 1748822405000 }
        ]
      }
    }
  }'
# Esperado: 200 {"received":true}
# Verificar en Supabase: tabla conversations, canal=voice, external_id=smoke-test-call-001
```

---

## 2. Stripe Webhook

> Para Stripe se requiere una firma HMAC válida. Usa el **Stripe CLI** para tests locales o
> el **Stripe Dashboard → Webhooks → Send test event** para producción.

### 2.1 Sin firma → 400 Bad Request
```bash
curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE_URL/api/billing/webhooks/stripe" \
  -H "Content-Type: application/json" \
  -d '{"type": "customer.subscription.updated"}'
# Esperado: 400 (Missing stripe-signature header)
```

### 2.2 Firma inválida → 400 Bad Request
```bash
curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE_URL/api/billing/webhooks/stripe" \
  -H "Content-Type: application/json" \
  -H "stripe-signature: t=1234567890,v1=firma_invalida_aqui" \
  -d '{"type": "customer.subscription.updated"}'
# Esperado: 400
# Verificar en Vercel Logs: event=SIGNATURE_VERIFICATION_FAILED
```

### 2.3 Evento real via Stripe CLI (recomendado para staging)
```bash
# Instalar Stripe CLI: https://stripe.com/docs/stripe-cli
stripe listen --forward-to $BASE_URL/api/billing/webhooks/stripe

# En otra terminal, disparar evento de prueba:
stripe trigger customer.subscription.updated
# Esperado: 200 {"received":true}
# Verificar en Vercel Logs: no event=HANDLER_EXCEPTION
```

### 2.4 Evento desconocido via Stripe CLI
```bash
stripe trigger payment_intent.created
# Esperado: 200 {"received":true}
# Verificar en Vercel Logs: event=UNHANDLED_EVENT_TYPE, stripe_event_type=payment_intent.created
```

### 2.5 Checkout session completada → sincronización de suscripción
```bash
stripe trigger checkout.session.completed
# Esperado: 200 {"received":true}
# Verificar en Supabase: tabla subscriptions, plan actualizado según price_id
```

---

## 3. WhatsApp Webhook

### 3.1 GET Verificación de webhook (setup Meta)
```bash
curl -s -w "\n%{http_code}" \
  "$BASE_URL/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=$META_VERIFY_TOKEN&hub.challenge=SMOKE_TEST_CHALLENGE_XYZ"
# Esperado: 200  SMOKE_TEST_CHALLENGE_XYZ
```

### 3.2 GET con token inválido → 403 Forbidden
```bash
curl -s -o /dev/null -w "%{http_code}" \
  "$BASE_URL/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=token_incorrecto&hub.challenge=abc"
# Esperado: 403
```

### 3.3 POST con phone_number_id desconocido → 200 OK (fire-and-forget) + WARN en logs
```bash
curl -s -w "\n%{http_code}" \
  -X POST "$BASE_URL/api/whatsapp/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "entry-smoke-001",
      "changes": [{
        "field": "messages",
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "+5491100000000",
            "phone_number_id": "PHONE_ID_INEXISTENTE_SMOKE_TEST"
          },
          "contacts": [{ "profile": { "name": "Tester Smoke" }, "wa_id": "5491100000001" }],
          "messages": [{
            "from": "5491100000001",
            "id": "wamid.smoke001",
            "timestamp": "1748822400",
            "type": "text",
            "text": { "body": "Hola, este es un smoke test" }
          }]
        }
      }]
    }]
  }'
# Esperado: 200 {"received":true}  (siempre, por diseño fire-and-forget)
# Verificar en Vercel Logs: event=UNKNOWN_TENANT, phone_number_id=PHONE_ID_INEXISTENTE_SMOKE_TEST
# NO debe existir registro en Supabase conversations para este mensaje
```

### 3.4 POST con payload malformado → 200 OK (error en logs)
```bash
curl -s -w "\n%{http_code}" \
  -X POST "$BASE_URL/api/whatsapp/webhook" \
  -H "Content-Type: application/json" \
  -d '{"object": "whatsapp_business_account", "entry": []}'
# Esperado: 200 {"received":true}
# No debe generar errores en logs (entry vacío es válido según spec de Meta)
```

---

## 4. Rate Limiting

### 4.1 Auth endpoint — límite 10 req/min
```bash
for i in $(seq 1 12); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"smoke@test.com","password":"wrongpass"}')
  echo "Request $i: $CODE"
done
# Esperado: primeras ~10 respuestas = 400/401, req 11+ = 429
# Header de respuesta en 429: Retry-After, X-RateLimit-Remaining: 0
```

### 4.2 Verificar header Retry-After en 429
```bash
curl -sI "$BASE_URL/api/auth/login" | grep -i retry-after
# Esperado si ya alcanzaste el límite: Retry-After: <segundos>
```

---

## 5. Headers de Seguridad HTTP

### 5.1 Verificar todos los headers en una respuesta de la app
```bash
curl -sI "$BASE_URL" | grep -iE "strict-transport|x-content-type|x-frame|referrer-policy|permissions-policy|cache-control"
```

**Respuesta esperada:**
```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### 5.2 Verificar que los API routes tienen Cache-Control: no-store
```bash
curl -sI "$BASE_URL/api/health" | grep -i cache-control
# Esperado: Cache-Control: no-store, no-cache, must-revalidate
```

### 5.3 Verificar CSP en respuesta dinámica (Next.js)
```bash
curl -sI "$BASE_URL/dashboard" | grep -i content-security-policy
# Esperado: Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-...' ...
# El nonce debe ser diferente en cada request (valor único por request)
```

---

## 6. Checklist de Validación

Una vez ejecutados todos los tests, confirmar cada ítem:

| # | Test | HTTP Esperado | Log Event | DB Verificado | OK |
|---|------|--------------|-----------|---------------|----|
| 1.1 | VAPI sin secret | 401 | — | — | ☐ |
| 1.2 | VAPI secret inválido | 401 | `INVALID_SECRET` | — | ☐ |
| 1.3 | VAPI evento desconocido | 200 | — | — | ☐ |
| 1.4 | VAPI end-of-call | 200 | — | `conversations` | ☐ |
| 2.1 | Stripe sin firma | 400 | — | — | ☐ |
| 2.2 | Stripe firma inválida | 400 | `SIGNATURE_VERIFICATION_FAILED` | — | ☐ |
| 2.3 | Stripe evento real | 200 | — | `subscriptions` | ☐ |
| 2.4 | Stripe evento desconocido | 200 | `UNHANDLED_EVENT_TYPE` | — | ☐ |
| 3.1 | WA GET verificación OK | 200 | — | — | ☐ |
| 3.2 | WA GET token inválido | 403 | — | — | ☐ |
| 3.3 | WA POST tenant desconocido | 200 | `UNKNOWN_TENANT` | No insert | ☐ |
| 4.1 | Rate limit auth 429 | 429 | — | — | ☐ |
| 5.1 | Headers seguridad en `/` | — | — | — | ☐ |
| 5.2 | Cache-Control en `/api/*` | — | — | — | ☐ |

---

## 7. Cómo Leer los Logs en Vercel

1. Ir a **Vercel Dashboard → Project → Logs**
2. Filtrar por **Function Logs**
3. Buscar por `event` para encontrar errores específicos:
   - `UNKNOWN_TENANT` — WhatsApp con phone_id no registrado
   - `INVALID_SECRET` — intento de llamada a VAPI con credencial incorrecta
   - `SIGNATURE_VERIFICATION_FAILED` — intento de spoofing en Stripe
   - `HANDLER_EXCEPTION` — error inesperado en handler (requiere investigación)

Todos los logs son JSON parseables. En Vercel CLI:
```bash
vercel logs $BASE_URL --follow | grep -v '"level":"info"'
```

---

*Documento generado para Sky Technologies LATAM — uso interno del equipo de ingeniería.*
