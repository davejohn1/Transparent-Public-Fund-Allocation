;; budget-approval.clar
;; Records authorized spending by department

;; Define a map to store budgets by department and year
(define-map budgets {department: (string-ascii 64), year: uint} uint)

;; Error codes
(define-constant ERR-UNAUTHORIZED u100)
(define-constant ERR-INVALID-AMOUNT u101)

;; Define which principal can authorize budgets (simplified)
(define-constant TREASURY-PRINCIPAL 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)

;; Check if caller is authorized
(define-private (is-authorized)
  (is-eq tx-sender TREASURY-PRINCIPAL)
)

;; Set budget for a department
(define-public (set-budget (department (string-ascii 64)) (year uint) (amount uint))
  (begin
    (asserts! (is-authorized) (err ERR-UNAUTHORIZED))
    (asserts! (> amount u0) (err ERR-INVALID-AMOUNT))
    (ok (map-set budgets {department: department, year: year} amount))
  )
)

;; Get budget for a department
(define-read-only (get-budget (department (string-ascii 64)) (year uint))
  (default-to u0 (map-get? budgets {department: department, year: year}))
)

;; Update budget for a department
(define-public (update-budget (department (string-ascii 64)) (year uint) (new-amount uint))
  (begin
    (asserts! (is-authorized) (err ERR-UNAUTHORIZED))
    (asserts! (> new-amount u0) (err ERR-INVALID-AMOUNT))
    (asserts! (is-some (map-get? budgets {department: department, year: year}))
              (err u102)) ;; Budget not found error
    (ok (map-set budgets {department: department, year: year} new-amount))
  )
)
