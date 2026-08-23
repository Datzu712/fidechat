# Esquema Oracle (obsoleto)

Estos archivos son el esquema y los paquetes PL/SQL originales, de cuando el
backend corria sobre Oracle 18c XE. Ya no se ejecutan: quedan solo como
referencia de la logica que se migro a TypeScript.

Donde vive ahora cada cosa:

| Objeto Oracle                        | Reemplazo                                                        |
| ------------------------------------ | ---------------------------------------------------------------- |
| `init.sql` (DDL)                     | `src/infrastructure/database/schema/*.ts` + `drizzle/`            |
| `PKG_GUILD`                          | `src/modules/guild/guild.repository.ts`                           |
| `PKG_CHANNEL`                        | `src/modules/channel/channel.repository.ts`                       |
| `PKG_MESSAGES`                       | `src/modules/message/message.repository.ts`                       |
| `PKG_USER` (incl. `SP_UPSERT_USER`)  | `src/modules/user/user.repository.ts`                             |
| `pkg_sync_data.fn_get_sync_data`     | `src/modules/user/currentUser/sync.repository.ts`                 |
| `sp_get_guild_users`                 | `UserRepository.getGuildUsers`                                    |
| `TRG_GUILD_ADD_OWNER`                | Insert explicito en la transaccion de `GuildRepository.createGuild`|
| `TRG_AUD_*` + tabla `AUDITORIA`      | `src/infrastructure/database/audit/audit.service.ts` + `audit_log` |
