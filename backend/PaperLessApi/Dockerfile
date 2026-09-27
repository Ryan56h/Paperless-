# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj and restore as distinct layers
COPY ["PaperLessApi.csproj", "./"]
RUN dotnet restore "./PaperLessApi.csproj"

# Copy everything else and build Release
COPY . .
RUN dotnet publish "PaperLessApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Default ASP.NET Core 9 port
EXPOSE 8080
ENV ASPNETCORE_HTTP_PORTS=8080

ENTRYPOINT ["dotnet", "PaperLessApi.dll"]
