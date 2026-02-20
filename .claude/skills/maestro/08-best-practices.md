# MODULE 8: BEST PRACTICES & OPTIMIZATION

## Test Organization

### Directory Structure

```
maestro/
├── maestro.yaml              # Project config
├── flows/
│   ├── auth/
│   │   ├── login_valid.yaml
│   │   ├── login_invalid_email.yaml
│   │   ├── signup.yaml
│   │   └── password_reset.yaml
│   ├── shopping/
│   │   ├── browse_products.yaml
│   │   ├── product_details.yaml
│   │   ├── add_to_cart.yaml
│   │   └── checkout.yaml
│   ├── profile/
│   │   ├── view_profile.yaml
│   │   ├── edit_profile.yaml
│   │   └── delete_account.yaml
│   ├── shared/
│   │   ├── common_login.yaml
│   │   └── navigate_home.yaml
│   └── smoke/
│       └── critical_flows.yaml
├── docs/
│   └── test_guidelines.md
└── README.md
```

### Naming Conventions

**Flow Files:**
```
{feature}_{scenario}.yaml

Examples:
- login_valid_credentials.yaml
- login_invalid_email.yaml
- product_add_to_cart.yaml
- checkout_payment_success.yaml
```

**testID Naming:**
```
{screen}_{component}_{type}

Examples:
- login_email_input
- login_submit_button
- cart_total_amount
- product_add_to_cart_btn
```

## Reducing Flakiness

### Problem: Tests Pass Sometimes, Fail Other Times

**Root Causes:**
1. Timing issues (app too slow)
2. Network delays
3. Animations not complete
4. Elements not yet visible

### Solution 1: Let Maestro Wait

**❌ DON'T do this:**
```yaml
- tapOn: "Login"
- sleep: 2000  # Manual delay
- assertVisible: "Dashboard"
```

**✅ DO this:**
```yaml
- tapOn: "Login"
- assertVisible: "Dashboard"  # Maestro waits automatically
```

### Solution 2: Use Visible Text

**❌ Fragile (coordinates change):**
```yaml
- tapOn: [150, 200]
```

**✅ Robust (text stable):**
```yaml
- tapOn: "Login Button"
```

### Solution 3: Use testID Instead of Text

**❌ Fragile (text can change):**
```yaml
- tapOn: "Enviar"  # Spanish: "Send"
```

**✅ Robust (testID stable):**
```yaml
- tapOn:
    id: "submit_button"
```

### Solution 4: Wait for State

```yaml
- tapOn:
    id: "checkout_button"
- assertVisible: "Order Confirmed"  # Waits until visible
```

## Modularizing Tests: Preventing Duplication & Friction

### The Problem: Recognizing Test Duplication

When you have multiple test flows that repeat the same setup steps, you're creating **friction**:
- ❌ Each test file has 50+ lines of duplicate setup
- ❌ Changes to navigation require updates in 5+ places
- ❌ Tests become harder to maintain and reason about
- ❌ New tests take longer to write (copy-paste everything)

**Warning Signs:**
```
If you're copy-pasting >15 lines of YAML between flows → Extract a helper
If you're repeating the same 5 taps in every test → Create a reusable flow
If fixing one bug requires updates to 3+ test files → Consolidate patterns
```

### Solution: Extract Reusable Flows (Helpers)

**❌ Anti-pattern (repeated 50 lines in each test):**
```yaml
# test1.yaml - 60 lines
appId: com.example.app
---
- launchApp
- tapOn: "Login"
- inputText: "user@example.com"
- tapOn: "Password"
- inputText: "password"
- tapOn: "Sign In"
- assertVisible: "Dashboard"
- tapOn: "Search"
- inputText: "product"
- tapOn: "Search Button"
- assertVisible: "Results"
# Now actual test logic...
```

```yaml
# test2.yaml - 60 lines (DUPLICATE!)
appId: com.example.app
---
- launchApp
- tapOn: "Login"
- inputText: "user@example.com"
- tapOn: "Password"
- inputText: "password"
- tapOn: "Sign In"
- assertVisible: "Dashboard"
- tapOn: "Profile"
- assertVisible: "User Profile"
# Different test logic...
```

**✅ Extract setup as helper:**

**helpers/login.yaml:**
```yaml
appId: com.example.app
---
- launchApp
- tapOn: "Login"
- inputText: "user@example.com"
- inputText: "password"
- tapOn: "Sign In"
- assertVisible: "Dashboard"
```

**helpers/navigate-to-search.yaml:**
```yaml
appId: com.example.app
---
- tapOn: "Search"
- inputText: "product"
- tapOn: "Search Button"
- assertVisible: "Results"
```

**test-search-functionality.yaml:**
```yaml
appId: com.example.app
---
- runFlow: helpers/login.yaml
- runFlow: helpers/navigate-to-search.yaml
# Now test only the search feature (10 lines instead of 60)
```

**test-profile-view.yaml:**
```yaml
appId: com.example.app
---
- runFlow: helpers/login.yaml
- tapOn: "Profile"
- assertVisible: "User Profile"
# Reused login, saved 30 lines of duplication
```

### When to Extract a Helper

Extract when a pattern appears in **2+ test flows**:

| Pattern | Extract As | Reuse In |
|---------|-----------|----------|
| App launch → auth flow | `helpers/auth-login.yaml` | All authenticated tests |
| Navigation to feature X | `helpers/navigate-to-x.yaml` | Tests for feature X |
| Common setup (create user, populate data) | `helpers/setup-test-user.yaml` | All tests needing data |
| Completion flow (checkout, submit form) | `helpers/complete-action.yaml` | Tests that verify end-to-end |

### Hierarchy of Test Organization

**Level 1: Helpers (Building Blocks)**
- Single responsibility: login, navigate, setup data
- Reusable across multiple tests
- Short (5-20 lines typically)

**Level 2: Feature Tests (Use Helpers)**
- Test one feature end-to-end
- Start with `runFlow: helpers/...`
- Focus on feature behavior (20-40 lines)

**Level 3: Journeys (Chain Multiple Features)**
- Test user workflows across features
- Compose multiple feature tests
- Optional: only for critical paths

**Example Structure:**
```
.maestro/
├── helpers/                    # Building blocks
│   ├── auth-login.yaml        # 8 lines: launch + login
│   ├── navigate-search.yaml   # 6 lines: open search screen
│   └── complete-purchase.yaml # 10 lines: checkout flow
│
├── features/                   # Feature-level tests
│   ├── search-products.yaml   # 15 lines: uses navigate-search
│   ├── add-to-cart.yaml       # 20 lines: product interaction
│   └── apply-discount.yaml    # 18 lines: promo code logic
│
└── journeys/                   # Full user paths
    └── complete-purchase-flow.yaml # 30 lines: all features together
```

### Common Pitfalls to Avoid

| Problem | Solution |
|---------|----------|
| Helper has too many steps (>20 lines) | Break into smaller helpers |
| Helper is used only once | Inline it (don't extract yet) |
| Helper has many `optional: true` flags | Simplify assertions, reduce friction |
| Tests sleep a lot (`sleep: 500`) | Use `extendedWaitUntil` instead |
| Duplicate assertions in every test | Extract to helper if common check |
| One massive test (>100 lines) | Split by feature/concern |

## Using Variables for Test Data

### Parameterize Data

**❌ Hardcoded:**
```yaml
- inputText: "test@example.com"
- inputText: "password123"
```

**✅ Using variables:**
```yaml
- inputText: ${TEST_EMAIL}
- inputText: ${TEST_PASSWORD}
```

**Run with different data:**
```bash
# Test account
TEST_EMAIL=test@example.com TEST_PASSWORD=pass123 maestro test login.yaml

# Production-like account
TEST_EMAIL=john@company.com TEST_PASSWORD=ProdPassword maestro test login.yaml
```

---

**Next:** See **09-cicd-integration.md** for CI/CD pipeline setup.
