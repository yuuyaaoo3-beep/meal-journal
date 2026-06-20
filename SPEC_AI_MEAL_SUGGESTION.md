# SPEC: AI献立提案 (AI Meal Suggestion) — Premium Feature

**Version:** 1.0  
**Target codebase:** `C:\Users\oy199\Desktop\meal-journal`  
**Implementing agent:** Agent B

---

## 1. Feature Overview

AI献立提案 is a premium-only feature that uses Claude (`claude-opus-4-8` with adaptive thinking) to suggest concrete Japanese meal plans tailored to the user's remaining calorie and macro budget for the day. The user selects whether they want a dinner suggestion (夕食) to complete today's eating, or a full next-day meal plan (翌日の献立). Claude streams back 3 practical Japanese meal suggestions with estimated PFC macros.

The feature lives inside the existing `isPremium` card at the bottom of `app/page.tsx`. The current minimal premium card (showing only "プレミアムプラン利用中") is replaced with a richer card that includes this feature.

---

## 2. Files to Create/Modify

### Create (new files)

- `app/api/ai-meal-suggestion/route.ts` — POST route handler, auth + premium check, Claude streaming

### Modify (existing files)

- `app/page.tsx` — Replace the `isPremium` card block (lines 210–215) with the full AI献立提案 UI component

---

## 3. API Route Spec

### Endpoint

```
POST /api/ai-meal-suggestion
```

### Request Body (JSON)

```typescript
{
  accessToken: string;           // Supabase JWT from supabase.auth.getSession()
  mealType: "dinner" | "next_day";
  todayConsumed: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
  dailyGoal: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
}
```

### Response

- **200 OK** — `Content-Type: text/plain; charset=utf-8`  
  Body is a streaming plain-text response. Each chunk is a UTF-8 string fragment of the AI's text output. Only `text`-type content blocks are forwarded; `thinking` blocks are discarded.

- **401 Unauthorized** — JSON `{ error: "Unauthorized" }`  
  Returned when `accessToken` is missing, invalid, or `auth.getUser()` fails.

- **403 Forbidden** — JSON `{ error: "Premium required" }`  
  Returned when the authenticated user's `user_goals.is_premium` is `false` or the row does not exist.

- **400 Bad Request** — JSON `{ error: "Invalid request" }`  
  Returned when required fields are absent or `mealType` is not one of the two valid values.

- **500 Internal Server Error** — JSON `{ error: "Internal server error" }`  
  Returned on unexpected failures (Supabase query error, Anthropic SDK error, etc.).

### Server-Side Auth Flow (step by step)

1. Parse request body. If `accessToken` is missing or `mealType` is invalid, return 400.
2. Create a Supabase client using `createClient` from `@supabase/supabase-js` with:
   - URL: `process.env.NEXT_PUBLIC_SUPABASE_URL`
   - Key: `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Options: `{ global: { headers: { Authorization: \`Bearer ${accessToken}\` } } }`
3. Call `supabase.auth.getUser()`. If it returns an error or `data.user` is null, return 401.
4. Extract `userId = data.user.id`.
5. Query: `supabase.from('user_goals').select('is_premium').eq('user_id', userId).single()`
6. If query returns an error or `data` is null, return 403.
7. If `data.is_premium !== true`, return 403.
8. Compute `remaining` (see §4 Prompt Design for the formula).
9. Build Claude prompt and start streaming (see §4).
10. Return the streaming `Response` with `Content-Type: text/plain; charset=utf-8`.

### Claude API Call Parameters

```
model: "claude-opus-4-8"
max_tokens: 4096
thinking: { type: "adaptive" }
stream: true  (via client.messages.stream())
```

Only emit text from content blocks whose `type === "text"`. Discard `thinking` blocks entirely. Use `@anthropic-ai/sdk`'s `.stream()` method and iterate over events, forwarding `text_delta` deltas.

The Anthropic client is initialized with `ANTHROPIC_API_KEY` from environment variables (no explicit key in code).

---

## 4. Prompt Design

### Remaining PFC Computation

```
remaining.calories = Math.max(0, dailyGoal.calories - todayConsumed.calories)
remaining.protein  = Math.max(0, dailyGoal.protein  - todayConsumed.protein)
remaining.fat      = Math.max(0, dailyGoal.fat      - todayConsumed.fat)
remaining.carbs    = Math.max(0, dailyGoal.carbs    - todayConsumed.carbs)
```

For `mealType === "next_day"`, use `dailyGoal` directly instead of `remaining` (the user wants a full-day plan).

### System Prompt (exact text)

```
あなたは日本の食事管理・栄養の専門家です。忙しい会社員が実際に実践できる、具体的で現実的な献立を提案することが得意です。コンビニや普通のスーパーで手に入る食材を使ったメニューを積極的に提案してください。カロリーとタンパク質・脂質・炭水化物（PFC）のバランスを重視し、ユーザーの目標に沿った提案をしてください。
```

### User Message Template

**For `mealType === "dinner"`:**

```
今日の残りの栄養目標は以下の通りです：
- カロリー残り：${remaining.calories} kcal
- タンパク質残り：${remaining.protein} g
- 脂質残り：${remaining.fat} g
- 炭水化物残り：${remaining.carbs} g

この残り目標に合わせた夕食を3つ提案してください。各提案には以下を含めてください：
1. 料理名と具体的な食材・量（例：コンビニ商品名でもOK）
2. 推定カロリー（kcal）
3. 推定PFC（タンパク質・脂質・炭水化物、各グラム）
4. 一言コメント（手軽さや栄養バランスについて）

忙しい会社員でも用意しやすい、現実的なメニューをお願いします。
```

**For `mealType === "next_day"`:**

```
明日の1日の栄養目標は以下の通りです：
- カロリー目標：${dailyGoal.calories} kcal
- タンパク質目標：${dailyGoal.protein} g
- 脂質目標：${dailyGoal.fat} g
- 炭水化物目標：${dailyGoal.carbs} g

この目標に合わせた明日1日分の献立（朝食・昼食・夕食）を3パターン提案してください。各パターンには以下を含めてください：
1. 朝食・昼食・夕食それぞれの料理名と具体的な食材・量
2. 1日合計の推定カロリー（kcal）と推定PFC
3. 一言コメント（準備のしやすさや特徴について）

忙しい会社員でも用意しやすい、現実的なメニューをお願いします。
```

---

## 5. TypeScript Types

```typescript
export interface AiMealSuggestionRequestBody {
  accessToken: string;
  mealType: MealSuggestionType;
  todayConsumed: MacroNutrients;
  dailyGoal: MacroNutrients;
}

export type MealSuggestionType = "dinner" | "next_day";

export interface MacroNutrients {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface ApiErrorResponse {
  error: string;
}

export type AiSuggestionStatus =
  | "idle"
  | "loading"
  | "streaming"
  | "complete"
  | "error";

export interface AiSuggestionState {
  status: AiSuggestionStatus;
  selectedMealType: MealSuggestionType;
  streamedText: string;
  errorMessage: string | null;
}

export interface FetchSuggestionParams {
  accessToken: string;
  mealType: MealSuggestionType;
  todayConsumed: MacroNutrients;
  dailyGoal: MacroNutrients;
}
```

---

## 6. UI Spec

The `isPremium` block in `app/page.tsx` is replaced in its entirety. Below is the element structure for each state.

### Shared Wrapper (always present when `isPremium === true`)

```jsx
<div className="mt-4 bg-gradient-to-br from-[#E4ECDF] to-[#F8F4ED] rounded-2xl p-5 border border-[#DDD6C8]">

  {/* Premium badge — always visible */}
  <p className="text-sm font-semibold text-[#7A9471] mb-1">🌟 プレミアムプラン利用中</p>
  <p className="text-xs text-[#5C574F] mb-4">AI機能がすべて使い放題です</p>

  {/* AI献立提案 section */}
  <div className="bg-white rounded-xl p-4 border border-[#DDD6C8]">
    <p className="text-sm font-semibold text-[#2C2A26] mb-3">🤖 AI献立提案</p>
    {/* CONTENT AREA — switches based on status */}
  </div>
</div>
```

### State: idle

```jsx
{/* Meal type selector */}
<div className="flex gap-2 mb-3">
  <button className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all
    ${selectedMealType === 'dinner'
      ? 'bg-[#7A9471] text-white border-[#7A9471]'
      : 'bg-[#F8F4ED] text-[#5C574F] border-[#DDD6C8]'}`}>
    🌙 夕食
  </button>
  <button className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all
    ${selectedMealType === 'next_day'
      ? 'bg-[#7A9471] text-white border-[#7A9471]'
      : 'bg-[#F8F4ED] text-[#5C574F] border-[#DDD6C8]'}`}>
    📅 翌日の献立
  </button>
</div>

{/* Trigger button */}
<button className="w-full py-3 bg-[#7A9471] text-white rounded-xl font-medium
                   hover:bg-[#6A8462] transition-colors text-sm">
  ✨ 献立を提案してもらう
</button>
```

### State: loading

```jsx
{/* Meal type selector — disabled */}
<div className="flex gap-2 mb-3 opacity-50 pointer-events-none">
  {/* same two buttons */}
</div>

{/* Loading skeleton */}
<div className="space-y-2 mt-2">
  <div className="h-3 bg-[#EFE8DA] rounded-full w-full animate-pulse" />
  <div className="h-3 bg-[#EFE8DA] rounded-full w-4/5 animate-pulse" />
  <div className="h-3 bg-[#EFE8DA] rounded-full w-3/5 animate-pulse" />
</div>
<p className="text-xs text-[#8A8377] mt-2 text-center">AIが考えています...</p>
```

### State: streaming

```jsx
{/* Meal type selector — disabled */}
<div className="flex gap-2 mb-3 opacity-50 pointer-events-none">
  {/* same two buttons */}
</div>

{/* Streamed text */}
<div className="text-sm text-[#2C2A26] leading-relaxed whitespace-pre-wrap
               bg-[#F8F4ED] rounded-xl p-3 min-h-[80px] border border-[#DDD6C8]">
  {streamedText}
  <span className="inline-block w-1 h-3 bg-[#7A9471] animate-pulse ml-0.5 align-middle" />
</div>
```

### State: complete

```jsx
{/* Meal type selector — re-enabled */}
<div className="flex gap-2 mb-3">
  {/* same two buttons, active */}
</div>

{/* Completed text */}
<div className="text-sm text-[#2C2A26] leading-relaxed whitespace-pre-wrap
               bg-[#F8F4ED] rounded-xl p-3 border border-[#DDD6C8] mb-3">
  {streamedText}
</div>

{/* Regenerate button */}
<button className="w-full py-2.5 bg-[#F8F4ED] text-[#7A9471] rounded-xl font-medium
                   border border-[#7A9471] hover:bg-[#E4ECDF] transition-colors text-sm">
  🔄 もう一度提案してもらう
</button>
```

### State: error

```jsx
{/* Meal type selector — re-enabled */}
<div className="flex gap-2 mb-3">
  {/* same two buttons, active */}
</div>

{/* Error message */}
<div className="bg-[#FCEEE5] border border-[#F5B89D] rounded-xl p-3 mb-3">
  <p className="text-xs text-[#E8835A] font-medium">エラーが発生しました</p>
  <p className="text-xs text-[#5C574F] mt-0.5">{errorMessage}</p>
</div>

{/* Retry button */}
<button className="w-full py-2.5 bg-[#7A9471] text-white rounded-xl font-medium
                   hover:bg-[#6A8462] transition-colors text-sm">
  ✨ もう一度試す
</button>
```

### Client-Side Fetch Logic (pseudocode)

When the trigger/retry button is clicked:
1. Set status to `"loading"`, clear `streamedText` and `errorMessage`.
2. Get `accessToken` from `supabase.auth.getSession()` → `session.access_token`.
3. POST to `/api/ai-meal-suggestion` with `{ accessToken, mealType: selectedMealType, todayConsumed: total, dailyGoal: { calories: goal?.target_cal ?? 1750, protein: goal?.protein ?? 100, fat: goal?.fat ?? 50, carbs: goal?.carbs ?? 200 } }`.
4. If response is not ok (status 4xx/5xx), read the JSON body, set status to `"error"` with the `error` field as `errorMessage`.
5. If response is ok, set status to `"streaming"` and begin reading the `ReadableStream` via `response.body.getReader()`.
6. For each decoded chunk, append to `streamedText`.
7. When the stream ends, set status to `"complete"`.
8. On any thrown exception, set status to `"error"` with message: `"提案の取得に失敗しました。しばらくしてからもう一度お試しください。"`.

---

## 7. Environment Variables

| Variable | Used by | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | `app/api/ai-meal-suggestion/route.ts` | SDK reads automatically from env. |
| `NEXT_PUBLIC_SUPABASE_URL` | `app/api/ai-meal-suggestion/route.ts` | Already set. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `app/api/ai-meal-suggestion/route.ts` | Already set. Used with user JWT override. |

**Do NOT use** `SUPABASE_SERVICE_ROLE_KEY` in this route.

---

## 8. Security Checklist

**Authentication**
- MUST call `supabase.auth.getUser()` server-side using user's JWT. Never trust a client-supplied `userId`.
- Create a fresh Supabase client per-request with user's JWT in `Authorization` header. Do NOT import/reuse `lib/supabase.js`.
- Return 401 when `getUser()` fails or returns no user.

**Authorization**
- Premium check MUST be server-side. `is_premium` from DB is authoritative.
- Return 403 when user exists but is not premium.

**Input validation**
- Validate `mealType` is exactly `"dinner"` or `"next_day"`. Anything else → 400.
- All numeric fields must be numbers. Clamp `remaining` values to zero minimum before prompt insertion.

**Prompt injection**
- Only numbers go into the prompt. No user text is interpolated.

**Streaming**
- Only stream `text`-type content blocks. Discard `thinking` blocks.
- Use `Content-Type: text/plain; charset=utf-8` for the streaming response.
- Use native `Response` constructor (not `NextResponse.json()`) for streaming.

**Error handling**
- Catch all errors around Anthropic SDK call. Never leak API keys or internal details in response.
- Return `{ error: "Internal server error" }` with status 500 for unexpected failures.

**Client-side**
- Fetch `accessToken` immediately before each API call via `supabase.auth.getSession()`.
- Do NOT store `accessToken` in React state.
- Guard against `goal` being null. Use defaults: 1750 kcal, 100g P, 50g F, 200g C.
