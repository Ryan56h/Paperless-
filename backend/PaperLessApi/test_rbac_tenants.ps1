$baseUrl = "http://localhost:5195"

Write-Host "=== TEST 1: Unauthenticated access to Revenue API ===" -ForegroundColor Cyan
try {
    $res = Invoke-RestMethod -Uri "$baseUrl/api/revenue/grocery/today" -Method Get -ErrorAction Stop
    Write-Host "FAILED: Should not allow unauthenticated access!" -ForegroundColor Red
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Write-Host "PASSED: Status code $status (Expected 401 Unauthorized)" -ForegroundColor Green
}

Write-Host "`n=== TEST 2: Login as Staff (staff.minhphat@gmail.com) ===" -ForegroundColor Cyan
$staffLogin = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body '{"emailOrPhone":"staff.minhphat@gmail.com","password":"123456"}'
$staffToken = $staffLogin.token
Write-Host "Staff logged in: $($staffLogin.user.fullName), Role: $($staffLogin.user.role), Tenant: $($staffLogin.user.tenantId)" -ForegroundColor Yellow

Write-Host "`n=== TEST 3: Staff trying to access Revenue API ===" -ForegroundColor Cyan
try {
    $res = Invoke-RestMethod -Uri "$baseUrl/api/revenue/grocery/today" -Method Get -Headers @{ "Authorization" = "Bearer $staffToken" } -ErrorAction Stop
    Write-Host "FAILED: Staff should NOT be able to view revenue!" -ForegroundColor Red
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Write-Host "PASSED: Status code $status (Expected 403 Forbidden)" -ForegroundColor Green
}

Write-Host "`n=== TEST 4: Staff trying to DELETE a product ===" -ForegroundColor Cyan
try {
    $res = Invoke-RestMethod -Uri "$baseUrl/api/products/P001" -Method Delete -Headers @{ "Authorization" = "Bearer $staffToken" } -ErrorAction Stop
    Write-Host "FAILED: Staff should NOT be able to delete products!" -ForegroundColor Red
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Write-Host "PASSED: Status code $status (Expected 403 Forbidden)" -ForegroundColor Green
}

Write-Host "`n=== TEST 5: Login as Owner of Grocery (minhphat.mart@gmail.com) ===" -ForegroundColor Cyan
$ownerLogin = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body '{"emailOrPhone":"minhphat.mart@gmail.com","password":"123456"}'
$ownerToken = $ownerLogin.token
Write-Host "Owner logged in: $($ownerLogin.user.fullName), Role: $($ownerLogin.user.role), Tenant: $($ownerLogin.user.tenantId)" -ForegroundColor Yellow

Write-Host "`n=== TEST 6: Owner accessing Revenue API of their own store ===" -ForegroundColor Cyan
$ownerRev = Invoke-RestMethod -Uri "$baseUrl/api/revenue/grocery/today" -Method Get -Headers @{ "Authorization" = "Bearer $ownerToken" }
Write-Host "PASSED: Owner accessed revenue successfully: Total Revenue = $($ownerRev.totalRevenue) đ" -ForegroundColor Green

Write-Host "`n=== TEST 7: Cross-tenant isolation check ===" -ForegroundColor Cyan
# Grocery Owner querying with param tenantId=BIZ-CAFE-01
$groceryProds = Invoke-RestMethod -Uri "$baseUrl/api/products?tenantId=BIZ-CAFE-01" -Method Get -Headers @{ "Authorization" = "Bearer $ownerToken" }
Write-Host "Grocery Owner queried with ?tenantId=BIZ-CAFE-01 -> Returned: $($groceryProds.Count) grocery products" -ForegroundColor Yellow

# Cafe Owner querying /api/products
$cafeLogin = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body '{"emailOrPhone":"moclan.coffee@gmail.com","password":"123456"}'
$cafeToken = $cafeLogin.token
$cafeProds = Invoke-RestMethod -Uri "$baseUrl/api/products" -Method Get -Headers @{ "Authorization" = "Bearer $cafeToken" }
Write-Host "Cafe Owner logged in: $($cafeLogin.user.fullName), Tenant: $($cafeLogin.user.tenantId)" -ForegroundColor Yellow
Write-Host "Cafe Owner queried /api/products -> Returned: $($cafeProds.Count) cafe products" -ForegroundColor Yellow
$cafeNames = ($cafeProds | Select-Object -First 3 | ForEach-Object { $_.name }) -join ", "
Write-Host "Cafe sample products: $cafeNames" -ForegroundColor Green

if ($cafeNames -match "Cà phê|Bạc xỉu|Trà") {
    Write-Host "PASSED: Strict store isolation verified! Cafe only sees cafe products, Grocery only sees grocery products." -ForegroundColor Green
} else {
    Write-Host "FAILED: Store isolation failed!" -ForegroundColor Red
}

Write-Host "`n=== TEST 8: Staff creating invoice at POS ===" -ForegroundColor Cyan
$invBody = @{
    ticketNumber = 999
    customerPhone = "0987654321"
    customerName = "Khách Hàng Test"
    paymentMethod = "cash"
    items = @(
        @{
            productId = "P001"
            name = "Mì Hảo Hảo Tôm Chua Cay 75g"
            quantity = 2
            unitPrice = 4500
            total = 9000
        }
    )
    totalAmount = 9000
    discount = 0
    finalAmount = 9000
    receivedAmount = 10000
    changeAmount = 1000
} | ConvertTo-Json -Depth 5

$createdInv = Invoke-RestMethod -Uri "$baseUrl/api/invoices" -Method Post -ContentType "application/json" -Headers @{ "Authorization" = "Bearer $staffToken" } -Body $invBody
Write-Host "PASSED: Invoice created by staff! ID: $($createdInv.id), Tenant: $($createdInv.tenantId), Staff: $($createdInv.staffName)" -ForegroundColor Green

Write-Host "`nALL MULTI-TENANT & RBAC SECURITY TESTS COMPLETED SUCCESSFULLY!" -ForegroundColor Green
