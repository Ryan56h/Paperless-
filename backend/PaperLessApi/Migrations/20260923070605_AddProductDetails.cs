using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PaperLessApi.Migrations
{
    /// <inheritdoc />
    public partial class AddProductDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Columns Barcode, Popular, Unit were already added in 20260923054707_AddGroceryFieldsToProductAndInvoice
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
