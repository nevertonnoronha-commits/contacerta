# Fix Debt Calculation Logic Directive

## Goal
Fix the logic error in `simplificarDividas` or `debtsByPerson` where a user's receivables are incorrectly transferred to another creditor when a new expense is added.

## Input
- Scenario:
    1. Leticia pays Uber (e.g., R$ 25.00 split among 3 people -> R$ 8.33 each).
    2. Neverton pays Lanche (e.g., R$ 30.00).
    3. **Bug**: Leticia's R$ 8.33 receivable is now shown as due to Neverton, or mixed up.
- Codebase: `c:\Users\Letícia\contacerta\app\src\App.jsx`

## Analysis Plan
1.  **Review Algorithm**: Analyze `calcularBalanco` and `simplificarDividas` in `App.jsx`.
2.  **Reproduction Script**: Create a standalone Node.js script `execution/verify_debt_logic.js` to simulate the user's scenario and print the output of `simplificarDividas`.
3.  **Identify Flaw**: Determine if the issue is in the *calculation* (balancing logic) or the *simplification* (graph reduction).
    - *Hypothesis*: The simplification algorithm might be blindly matching the biggest debtor to the biggest creditor, ignoring who actually paid for specific events if it attempts to minimize transactions (which is usually desired, but might be confusing if not explained, or implemented wrongly).
    - *User Expectation*: "O apagar tem q estar registrado no id do usuario marcado". This suggests the user might NOT want full debt simplification (where A->B and B->C becomes A->C), OR the simplification is just wrong.
    - *Correction*: Ensure the algorithm yields mathematically correct net balances, and check if the assignment of "who pays whom" is optimal/correct.
4.  **Fix**: Modify the logic in `App.jsx`.

## Execution Steps
1.  Create `execution/verify_debt_logic.js`.
2.  Run script and observe output.
3.  Refine logic in script until matches expectations.
4.  Apply fix to `App.jsx`.
