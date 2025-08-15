-- Custom SQL migration file, put you code below! --

DROP VIEW IF EXISTS public."issued_trans";


CREATE OR REPLACE VIEW public."issued_trans" AS 

-- 1

SELECT 'STATUS_5' AS issue_type,
       t.*
FROM topup_transactions t
WHERE (t.status = 5
       AND t.lite_user_id IS NULL)
UNION ALL --2

SELECT 'STATUS_130' AS issue_type,
       t.*
FROM topup_transactions t
WHERE t.id in
    (SELECT t.id
     FROM topup_transactions t
     LEFT JOIN topup_transaction_details d ON d.topup_transaction_id = t.id
     WHERE (d.status = 130
            AND t.lite_user_id IS NOT NULL) )
UNION ALL --3 Wrong sum

SELECT 'WRONG-SUM' AS issue_type,
       t.*
FROM topup_transactions t
WHERE t.id in
    (SELECT t.id
     FROM topup_transactions t
     LEFT JOIN topup_transaction_details d ON d.topup_transaction_id = t.id
     GROUP BY t.id,
              t.total_amount
     HAVING t.total_amount - sum(d.amount) > 0)
UNION ALL --4 No-Provider-Receipt

SELECT 'NO-RECEIPT' AS issue_type,
       t.*
FROM topup_transactions t
WHERE t.id in
    (SELECT t.id
     FROM topup_transactions t
     LEFT JOIN topup_transaction_details d ON d.topup_transaction_id = t.id
     WHERE t.status = 2
       AND d.provider_receipt IS NULL )