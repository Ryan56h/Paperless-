# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Prevent segmentation fault (SIGSEGV 139) & OOM on low-memory container hosts
ENV DOTNET_CLI_TELEMETRY_OPTOUT=1
ENV DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1
ENV DOTNET_EnableWriteXorExecute=0
ENV DOTNET_gcServer=0

# Copy csproj and restore as distinct layers
COPY ["PaperLessApi.csproj", "./"]
RUN dotnet restore "./PaperLessApi.csproj"

# Copy everything else and build Release
COPY . .
RUN dotnet publish "PaperLessApi.csproj" -c Release -o /app/publish --no-restore /p:UseAppHost=false

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

ENV DOTNET_EnableWriteXorExecute=0
ENV DOTNET_gcServer=0

COPY --from=build /app/publish .

# Default ASP.NET Core 9 port
EXPOSE 8080
ENV ASPNETCORE_HTTP_PORTS=8080

ENTRYPOINT ["dotnet", "PaperLessApi.dll"]
