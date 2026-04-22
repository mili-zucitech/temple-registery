# PowerShell script to fix the governance_version issue
# This connects to your TiDB database and removes the problematic column

$env:MYSQL_PWD = "6sXYNlDhrX80xnDz"

# Note: You need MySQL client installed
# Download from: https://dev.mysql.com/downloads/mysql/

mysql -h gateway01.ap-southeast-1.prod.aws.tidbcloud.com `
      -P 4000 `
      -u "3Nkwm2fKtuGqoiu.root" `
      -D test `
      --ssl-mode=REQUIRED `
      -e "ALTER TABLE asset_declarations DROP COLUMN IF EXISTS governance_version;"

Write-Host "Column removed successfully!" -ForegroundColor Green
