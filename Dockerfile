FROM postgres:14

ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres
ENV POSTGRES_DB=chatgpt4kids

EXPOSE 5432

HEALTHCHECK --interval=5s --timeout=5s --retries=5 CMD pg_isready -U postgres

VOLUME ["/var/lib/postgresql/data"]