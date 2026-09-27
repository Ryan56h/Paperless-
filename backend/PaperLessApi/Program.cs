using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using PaperLessApi.Data;
using PaperLessApi.Services;

var builder = WebApplication.CreateBuilder(args);

// Support Render / Cloud dynamic PORT
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(port))
{
    builder.WebHost.UseUrls($"http://*:{port}");
}

builder.Services.AddControllers();
builder.Services.AddHttpClient();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Support both standard ConnectionStrings and cloud DATABASE_URL (postgres://...)
string? connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
if (!string.IsNullOrEmpty(databaseUrl) && (databaseUrl.StartsWith("postgres://") || databaseUrl.StartsWith("postgresql://")))
{
    var uri = new Uri(databaseUrl);
    var userInfo = uri.UserInfo.Split(':');
    var user = userInfo[0];
    var password = userInfo.Length > 1 ? userInfo[1] : "";
    var dbPort = uri.Port > 0 ? uri.Port : 5432;
    var database = uri.AbsolutePath.TrimStart('/');
    connectionString = $"Host={uri.Host};Port={dbPort};Database={database};Username={user};Password={password};SSL Mode=Require;Trust Server Certificate=true;GssEncryptionMode=Disable";
}
else if (!string.IsNullOrEmpty(connectionString) && !connectionString.Contains("GssEncryptionMode", StringComparison.OrdinalIgnoreCase))
{
    connectionString += ";GssEncryptionMode=Disable";
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// Repositories
builder.Services.AddScoped(typeof(PaperLessApi.Repositories.IGenericRepository<>), typeof(PaperLessApi.Repositories.GenericRepository<>));
builder.Services.AddScoped<PaperLessApi.Repositories.IInvoiceRepository, PaperLessApi.Repositories.InvoiceRepository>();
builder.Services.AddScoped<PaperLessApi.Repositories.IProductRepository, PaperLessApi.Repositories.ProductRepository>();
builder.Services.AddScoped<PaperLessApi.Repositories.ICustomerRepository, PaperLessApi.Repositories.CustomerRepository>();

// Services
builder.Services.AddScoped<IInvoiceService, InvoiceService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<ICustomerService, CustomerService>();
builder.Services.AddScoped<IRevenueService, RevenueService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddSingleton<IOtpService, OtpService>();
builder.Services.AddSingleton<IPasswordResetService, PasswordResetService>();
builder.Services.AddScoped<IEmailService, EmailService>();

var jwtKey = builder.Configuration["Jwt:Key"]!;
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(origin => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "PaperLess+ SaaS API", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "PaperLess+ SaaS API v1");
    c.RoutePrefix = "swagger";
});

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

try
{
    await DbInitializer.SeedAsync(app.Services);
}
catch (Exception ex)
{
    Console.WriteLine($"[DbInitializer Warning]: {ex.Message}");
}

app.Run();