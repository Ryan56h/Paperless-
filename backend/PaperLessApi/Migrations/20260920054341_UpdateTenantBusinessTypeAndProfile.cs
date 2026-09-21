using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PaperLessApi.Migrations
{
    /// <inheritdoc />
    public partial class UpdateTenantBusinessTypeAndProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "Tenants",
                type: "character varying(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "BusinessType",
                table: "Tenants",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "OwnerName",
                table: "Tenants",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Address",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "BusinessType",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "OwnerName",
                table: "Tenants");
        }
    }
}
