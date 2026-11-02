# Mapa de commits: monorepo ↔ repositorios originales

Al fusionar los dos repositorios en este monorepo, sus archivos se movieron a
`apps/api` y `apps/web`. Eso reescribe los hashes de todos los commits importados,
aunque autor, fecha y mensaje se conservan intactos.

Esta tabla relaciona cada commit importado con su hash **original**, que se puede
verificar en los repositorios archivados en GitHub:

- [Datzu712/Fidechat-backend](https://github.com/Datzu712/Fidechat-backend) → `apps/api` (102 commits)
- [Datzu712/fidechat-web](https://github.com/Datzu712/fidechat-web) → `apps/web` (69 commits)

El emparejamiento se hizo por fecha de autor, email y mensaje (coinciden 171 de 171),
y el árbol de archivos del último commit de cada repo original es idéntico al de
`apps/api` y `apps/web` en el punto de fusión.

Versiones: **v1** = Java/Spring Boot + React/Vite, **v2** = NestJS/Oracle + Next.js.
Ver la sección "Historia del proyecto" del [README](../README.md).


## Fidechat-backend → `apps/api`

| Versión | Fecha | Monorepo | Original | Mensaje |
| --- | --- | --- | --- | --- |
| v1 | 2024-11-27 | `b63e6d4` | [`593e982`](https://github.com/Datzu712/Fidechat-backend/commit/593e9824238a0219b3849b6a2cebc7a88146e389) | first commit* |
| v1 | 2024-11-27 | `64d85de` | [`98e2b87`](https://github.com/Datzu712/Fidechat-backend/commit/98e2b87f39776f5f6ec12602e4e1172936aa965d) | + gitignore |
| v1 | 2024-11-27 | `5da21a5` | [`362a151`](https://github.com/Datzu712/Fidechat-backend/commit/362a1512f71caa20c15ed9d0471bb5af1566221d) | Bump org.postgresql:postgresql from 42.6.0 to 42.6.1 |
| v1 | 2024-11-27 | `e5c5c58` | [`32fc8b9`](https://github.com/Datzu712/Fidechat-backend/commit/32fc8b90ccc6774d4318c24aa324cdcd9d5cd7cc) | Delete target directory |
| v1 | 2024-11-27 | `81db45a` | [`ba774ac`](https://github.com/Datzu712/Fidechat-backend/commit/ba774accbddfa4b27fa5f2bf822a8a71609c8de8) | + models |
| v1 | 2024-11-27 | `f1fd5bc` | [`644c201`](https://github.com/Datzu712/Fidechat-backend/commit/644c20133e0ec83fc220c9cbbb2a3746afbaf70c) | database class for get connection, models and repositories |
| v1 | 2024-11-27 | `60cfd9c` | [`f3a6355`](https://github.com/Datzu712/Fidechat-backend/commit/f3a6355c42a570f57ef627fe9f87c0a495059d37) | User crud controller/repo & models update |
| v1 | 2024-11-27 | `795f30a` | [`9b02e43`](https://github.com/Datzu712/Fidechat-backend/commit/9b02e43569e7ad0f0b4cf0b5af802d6a14a450b2) | websocket prueba |
| v1 | 2024-11-27 | `d42310c` | [`2c04535`](https://github.com/Datzu712/Fidechat-backend/commit/2c04535330e095d7321ab0c9b11406e8ec51f056) | basic websocket connection |
| v1 | 2024-11-28 | `801c190` | [`82634e5`](https://github.com/Datzu712/Fidechat-backend/commit/82634e533178001ff0db323a0ad1f1a8a0663ca4) | Merge pull request #1 from Datzu712/dependabot/maven/org.postgresql-postgresql-42.6.1 |
| v1 | 2024-11-28 | `a978661` | [`5156fa9`](https://github.com/Datzu712/Fidechat-backend/commit/5156fa9f8eccecc68e110d915e4646e96e152107) | added user servide and deapsource conf file |
| v1 | 2024-11-28 | `c9038d4` | [`605c248`](https://github.com/Datzu712/Fidechat-backend/commit/605c2484fdb491e8d93c1b284f21c8d811762282) | authentication |
| v1 | 2024-11-29 | `db51fec` | [`194eb3f`](https://github.com/Datzu712/Fidechat-backend/commit/194eb3f5d133ca66a804bae6a371f1dbffa60097) | user -> userModel |
| v1 | 2024-11-29 | `530508f` | [`0c3050e`](https://github.com/Datzu712/Fidechat-backend/commit/0c3050e4b34f29531979fa93d2ce83a7f50a805f) | FINALLY CORS DOESNT BOTHER ANYMORE AHG |
| v1 | 2024-12-01 | `44cedd5` | [`96d0d25`](https://github.com/Datzu712/Fidechat-backend/commit/96d0d254e45870fb58cd1836cb50525bab4c0bf5) | cors fixed |
| v1 | 2024-12-01 | `7d121e7` | [`4e57ba0`](https://github.com/Datzu712/Fidechat-backend/commit/4e57ba0286f277bab2c81602a1aa5d62e39c7ba3) | Implement channel management and user context handling |
| v1 | 2024-12-01 | `00815ec` | [`e3de500`](https://github.com/Datzu712/Fidechat-backend/commit/e3de5008594f9ac0cd6cf0b39019faba8d058c50) | Added abstract event type |
| v1 | 2024-12-01 | `966fb9b` | [`1179cf4`](https://github.com/Datzu712/Fidechat-backend/commit/1179cf47ddb388453d7b36c959cefe590fdd47cd) | websocket auth |
| v1 | 2024-12-01 | `b6db5dc` | [`a1e43e7`](https://github.com/Datzu712/Fidechat-backend/commit/a1e43e7acf5c1d17d9c84a2f4adb05cee145de2a) | Refactor ChannelsController API path and enhance message creation event handling |
| v1 | 2024-12-01 | `ec6b4b7` | [`3667c84`](https://github.com/Datzu712/Fidechat-backend/commit/3667c84c2f93ace3b948dd707c30b856948ee1cd) | Enhance channel creation process and WebSocket integration |
| v1 | 2024-12-02 | `8c72eb2` | [`7a1cde5`](https://github.com/Datzu712/Fidechat-backend/commit/7a1cde5a1be3219871a57c6f5ba01108f8db0e9b) | Remove TestController, update UserController API path, and add UtilController for ping … |
| v1 | 2024-12-02 | `c80232b` | [`67b081b`](https://github.com/Datzu712/Fidechat-backend/commit/67b081b538ae9a7a4875aa7ec31783f45a8fa5bd) | idk |
| v1 | 2024-12-14 | `f3e6770` | [`d08f44b`](https://github.com/Datzu712/Fidechat-backend/commit/d08f44b349431091087212a1b5a3efa23f9bda2b) | new route |
| v1 | 2024-12-14 | `1763344` | [`90a0a76`](https://github.com/Datzu712/Fidechat-backend/commit/90a0a76e81bfb22cb5301d492deb339709742e28) | Add ApplicationController for serving static index.html and configure static resource l… |
| v1 | 2024-12-15 | `ae7a741` | [`a112f60`](https://github.com/Datzu712/Fidechat-backend/commit/a112f6018b4c6c398da992f94b6e4b918a0b20c3) | + swagger |
| v1 | 2024-12-15 | `abd0151` | [`8f28669`](https://github.com/Datzu712/Fidechat-backend/commit/8f28669340d97e4ae788de4a221ca5cc0130c602) | Remove unused imports in MessageController and add createdAt field in ChannelRepository… |
| v1 | 2024-12-15 | `9757b3c` | [`e7afcbc`](https://github.com/Datzu712/Fidechat-backend/commit/e7afcbc703c135bd97b6d77687a597ee4cf9a5c2) | frontend update |
| v1 | 2024-12-15 | `f573bf2` | [`358e072`](https://github.com/Datzu712/Fidechat-backend/commit/358e072e01cf8070875a5389ac0e88b0f79db8d8) | docker? |
| v1 | 2024-12-15 | `ce078d3` | [`a017fe9`](https://github.com/Datzu712/Fidechat-backend/commit/a017fe94fbd7e7d8b8f00b0e72fadda85bde6747) | docker bugfix |
| v1 | 2024-12-15 | `31a3bd2` | [`928f35d`](https://github.com/Datzu712/Fidechat-backend/commit/928f35d3277c4d9eba157cc6ae5bcb8f216a757c) | docker bugfix x2 |
| v1 | 2024-12-15 | `8bcd5d1` | [`72f4bf7`](https://github.com/Datzu712/Fidechat-backend/commit/72f4bf7aa50e71155fe75af1227857e9239e59c4) | nginx |
| v1 | 2024-12-16 | `85e6efb` | [`067b2ce`](https://github.com/Datzu712/Fidechat-backend/commit/067b2ce12026d363541115f90ca684612c32e69a) | idk |
| v1 | 2024-12-16 | `2d43857` | [`f710237`](https://github.com/Datzu712/Fidechat-backend/commit/f71023702b0a59462614eb70ca65b150b2373feb) | nginx conf removed |
| v1 | 2024-12-16 | `5cbef6d` | [`3d6ed57`](https://github.com/Datzu712/Fidechat-backend/commit/3d6ed57d3afeb3ce6685755a7d1369ed510a8429) | + logOut service & docs |
| v1 | 2024-12-16 | `be00e02` | [`2b7149f`](https://github.com/Datzu712/Fidechat-backend/commit/2b7149f5b5b75c70ae8635f4f7ddd0b8d827a5f4) | logout endpoint |
| v1 | 2024-12-16 | `ce3f121` | [`d2bb78d`](https://github.com/Datzu712/Fidechat-backend/commit/d2bb78d27b5518a8e80783cd8a6360bc72eebdfe) | password validation |
| v1 | 2024-12-16 | `e981668` | [`0abc923`](https://github.com/Datzu712/Fidechat-backend/commit/0abc9230fd1a277937c3b694d83adcccea88c227) | edit channel |
| v1 | 2024-12-16 | `fbf5ddc` | [`255904d`](https://github.com/Datzu712/Fidechat-backend/commit/255904d42997e155a660cec7b70e5676da69439d) | add members to chat |
| v1 | 2025-02-13 | `15ffca2` | [`b75dc87`](https://github.com/Datzu712/Fidechat-backend/commit/b75dc87be43383c5b713c2c73d26be324e5196c0) | bugfix |
| v1 | 2025-02-13 | `ffd370b` | [`f6deb7d`](https://github.com/Datzu712/Fidechat-backend/commit/f6deb7d490a3f3b22894c4f8c8c70085c9818e26) | added db backup |
| v2 | 2025-07-11 | `740998c` | [`45f0c74`](https://github.com/Datzu712/Fidechat-backend/commit/45f0c747e9d38f6ac42c4b01b3692d94832ff9a4) | inital refactor setup |
| v2 | 2025-07-11 | `8dd1f51` | [`4093a8a`](https://github.com/Datzu712/Fidechat-backend/commit/4093a8ade693503b20c86348c9c0ffa50f93f6a7) | Create codeql.yml |
| v2 | 2025-07-11 | `df4cf74` | [`61f8ad7`](https://github.com/Datzu712/Fidechat-backend/commit/61f8ad7019c747865531dcd563246e1191dab6dd) | oracle connection |
| v2 | 2025-07-12 | `2140073` | [`4b698dc`](https://github.com/Datzu712/Fidechat-backend/commit/4b698dc7606c76cf57a60ddf1548f30bcdd3d06b) | Add database connection verification and environment configuration |
| v2 | 2025-07-18 | `55b39ff` | [`9d181e3`](https://github.com/Datzu712/Fidechat-backend/commit/9d181e3e79b169411898e0f23099e79218e92738) | feat: Added docker compose for oracle, keycloak & pg local development |
| v2 | 2025-07-25 | `8968ea3` | [`0b4da81`](https://github.com/Datzu712/Fidechat-backend/commit/0b4da81dc30d139c6415d1ed3bc9ea170ebd3b7b) | packages update and other changes related to env configuration/usage in differents modu… |
| v2 | 2025-07-25 | `734df61` | [`7ee9643`](https://github.com/Datzu712/Fidechat-backend/commit/7ee9643963d37f8cd9312a7027388bf9c83df2cd) | removed unused packages and added keycloak |
| v2 | 2025-07-25 | `7c8c8b5` | [`b13ba45`](https://github.com/Datzu712/Fidechat-backend/commit/b13ba45002ff4493633b04aaf59854012d169fbb) | feat: Integrate Keycloak authentication |
| v2 | 2025-07-27 | `9bb8d95` | [`e4bd713`](https://github.com/Datzu712/Fidechat-backend/commit/e4bd7132c15fae82bf2f97047151016c6ef03ff7) | feat: Update database connection to use Sequelize and add Keycloak sync interceptor - R… |
| v2 | 2025-07-30 | `a0d78b8` | [`ff02828`](https://github.com/Datzu712/Fidechat-backend/commit/ff028280cccdcd159aacb410393d628a1b4bb42e) | removed sequelize and added keycloak user sync process |
| v2 | 2025-07-30 | `166c959` | [`64cd080`](https://github.com/Datzu712/Fidechat-backend/commit/64cd0804c61ba67c008812790086bbe138351a6b) | refactor: fixed user synchronization logic in UserService |
| v2 | 2025-08-02 | `8f2ee42` | [`5cdae23`](https://github.com/Datzu712/Fidechat-backend/commit/5cdae237e3131b20a350e6af38bbe17a0e162421) | refactor: restructure user module and introduce guild module |
| v2 | 2025-08-10 | `2bb2c33` | [`eb0f23e`](https://github.com/Datzu712/Fidechat-backend/commit/eb0f23e067c1e8fcf1717ca13779081efdfd2718) | + Sync controller, database packages, and more.......... |
| v2 | 2025-08-10 | `b211acc` | [`8ffd11b`](https://github.com/Datzu712/Fidechat-backend/commit/8ffd11b2059a9f67c244d53c6f6ef2331a161403) | refactor: update GatewayService to use readonly client and clean up GuildController and… |
| v2 | 2025-08-11 | `b47c415` | [`eb5f7cc`](https://github.com/Datzu712/Fidechat-backend/commit/eb5f7cc81d9e68a97dd909e4e8b9444c7b364ba7) | refactor: enhance guild management with updated procedures, socket events, and validati… |
| v2 | 2025-08-11 | `67a5ff4` | [`dac4759`](https://github.com/Datzu712/Fidechat-backend/commit/dac47597b17ca9458be2ab63db9c7c85e7859585) | Added support profile icons from google and github. (Azure only returns a buffer image … |
| v2 | 2025-08-11 | `62acf2e` | [`1284bbc`](https://github.com/Datzu712/Fidechat-backend/commit/1284bbc43efc56f15ae819827b8b057ece90da5c) | refactor: Full DB backup update |
| v2 | 2025-08-11 | `d2b6e68` | [`d158878`](https://github.com/Datzu712/Fidechat-backend/commit/d1588780ad51c7ab979359f76abe264d6930bae8) | refactor: add channel management package with CRUD operations and error handling (+ som… |
| v2 | 2025-08-11 | `4667838` | [`a6e3778`](https://github.com/Datzu712/Fidechat-backend/commit/a6e37788fd18ce29db3c6466dea6b73070e29fc7) | refactor: update GUILD_USERS table to set primary key and fix foreign key reference to … |
| v2 | 2025-08-11 | `5b486e3` | [`ee738ef`](https://github.com/Datzu712/Fidechat-backend/commit/ee738ef4603716b3403b2797626533b585557d79) | refactor: update pkg_sync_data package with JSON functions and add trigger for guild ow… |
| v2 | 2025-08-11 | `91f0b27` | [`cfe8034`](https://github.com/Datzu712/Fidechat-backend/commit/cfe80347ed4e13da3fc27118d1ddf95f25ee3c01) | refactor: remove redundant owner_id check from fn_get_channels_json function |
| v2 | 2025-08-11 | `9a988ca` | [`7539c27`](https://github.com/Datzu712/Fidechat-backend/commit/7539c27bfdad81b0b50074227a9fc295c1dd71ed) | feat: add channel management functionality with WebSocket integration |
| v2 | 2025-08-12 | `f76b771` | [`d8bc59d`](https://github.com/Datzu712/Fidechat-backend/commit/d8bc59dc467937a1b8e41eddaf47aec8eaf9242a) | fix: fixed payload of event "CHANNEL_CREATE" |
| v2 | 2025-08-12 | `a78c202` | [`27a1db3`](https://github.com/Datzu712/Fidechat-backend/commit/27a1db3f358e6d66579a924b2fd4dd4658692f92) | feat: add description field to guild JSON response in pkg_sync_data package |
| v2 | 2025-08-12 | `d541add` | [`12be9eb`](https://github.com/Datzu712/Fidechat-backend/commit/12be9ebafd81f645bc96e33cbdb8ff8a25228273) | readme update |
| v2 | 2025-08-12 | `0ae0265` | [`96e8aa3`](https://github.com/Datzu712/Fidechat-backend/commit/96e8aa38ce77b3bd22c837ec281921ab571e96ab) | type shiiii |
| v2 | 2025-08-16 | `eacdf67` | [`fbb7ada`](https://github.com/Datzu712/Fidechat-backend/commit/fbb7ada15dc5b7c6d05cc13edece3e9d418b5502) | feat: add auditing triggers for APP_USER, GUILD, GUILD_USERS, and CHANNEL tables |
| v2 | 2025-08-17 | `86b1a9d` | [`24b56a1`](https://github.com/Datzu712/Fidechat-backend/commit/24b56a106a815dbfb29e80a98bc120cb2dad93fe) | feat: docker deploy update |
| v2 | 2025-08-18 | `5ad0daa` | [`f0c3f71`](https://github.com/Datzu712/Fidechat-backend/commit/f0c3f71eb0d5337fdf8e56a575968b4c0894b99b) | type shi |
| v2 | 2025-08-18 | `1842b18` | [`3910e3b`](https://github.com/Datzu712/Fidechat-backend/commit/3910e3bfdc355eed06dad329b2bcc317d8a0bf2e) | feat: removed the worst database (oracle) of all times from docker compose |
| v2 | 2025-08-18 | `3a499e5` | [`ed76e7f`](https://github.com/Datzu712/Fidechat-backend/commit/ed76e7f867ee31abca6dc1404fb6a33671abd738) | feat: sql updated |
| v2 | 2025-08-18 | `1810e62` | [`1dcb941`](https://github.com/Datzu712/Fidechat-backend/commit/1dcb941e63377e66ba3313e61ae9da47825330f2) | refactor: comment out resource limits in backend deployment |
| v2 | 2025-08-18 | `4411ef7` | [`4996e53`](https://github.com/Datzu712/Fidechat-backend/commit/4996e5393dee754f050d92130d80df637e02a0c3) | fix: update port mapping syntax for keycloak service |
| v2 | 2025-08-18 | `646489a` | [`c55ed47`](https://github.com/Datzu712/Fidechat-backend/commit/c55ed47a46918a05dbfe14859363068a78756c4a) | feat: add Keycloak bootstrap admin credentials to docker-compose |
| v2 | 2025-08-18 | `c01c9f6` | [`585e6a3`](https://github.com/Datzu712/Fidechat-backend/commit/585e6a32af3b3c2c7bbd6301f5d0a35ec8f1f708) | fix: update Keycloak bootstrap admin credentials environment variable references |
| v2 | 2025-08-18 | `8722ff8` | [`fd9afee`](https://github.com/Datzu712/Fidechat-backend/commit/fd9afeeac3f1e5a1a136023126d2944d4379e5e6) | feat: add Keycloak HTTP relative path environment variable and Nginx configuration |
| v2 | 2025-08-18 | `155ac3c` | [`4679e06`](https://github.com/Datzu712/Fidechat-backend/commit/4679e06df544042bc07206d8a5c284beae07f08e) | feat: update Keycloak production settings for hostname and HTTP configuration |
| v2 | 2025-08-18 | `67cc19e` | [`d6270e9`](https://github.com/Datzu712/Fidechat-backend/commit/d6270e9f2748e33e26023ba0eb9b22d5401c2a18) | feat: nginx config, docker update and env update |
| v2 | 2025-08-18 | `edf273d` | [`5d75db3`](https://github.com/Datzu712/Fidechat-backend/commit/5d75db362895185ff18a68ed357683f86a56c4e5) | fix: comment out KC_HOSTNAME_ADMIN environment variable in docker-compose |
| v2 | 2025-08-18 | `e463ab1` | [`370a716`](https://github.com/Datzu712/Fidechat-backend/commit/370a716458c923942dce8f2e277c254b08aac94f) | feat: add env PUBLIC_KEYCLOAK_URL for configurable Keycloak authentication |
| v2 | 2025-08-18 | `34fb838` | [`97fd02d`](https://github.com/Datzu712/Fidechat-backend/commit/97fd02d7bcd038138fab18ce8d66c18f7af5a231) | fix: update volume name for Keycloak PostgreSQL data |
| v2 | 2025-08-18 | `d2be00f` | [`1d2fe44`](https://github.com/Datzu712/Fidechat-backend/commit/1d2fe4432ef2f5f9b4518b686c3823919cdcc69c) | feat: implement user upsert functionality and enhance guild user management |
| v2 | 2025-08-19 | `86ffbc6` | [`adba159`](https://github.com/Datzu712/Fidechat-backend/commit/adba1591cea76ed91d5cbf00dec550ae7cc31cbf) | feat: enhance message handling with new DTO and repository methods |
| v2 | 2025-08-19 | `7e0922f` | [`99fc9b1`](https://github.com/Datzu712/Fidechat-backend/commit/99fc9b1faace5681efde20ebeac7034ad70b2b17) | fix: update API port binding in docker-compose and remove unused SQL package |
| v2 | 2025-08-19 | `4ca2b34` | [`22e8f89`](https://github.com/Datzu712/Fidechat-backend/commit/22e8f89f2aa70b55d0ab253deb7e80ae7c144f93) | fix: simplify token handling in development mode for WebSocket connections |
| v2 | 2025-08-19 | `3014c69` | [`d3c760d`](https://github.com/Datzu712/Fidechat-backend/commit/d3c760dc819bf5869bbffe37a0eca718835016b7) | fix: update WebSocket configuration and adjust JWT issuer handling in GatewayService |
| v2 | 2025-08-19 | `bfe81b7` | [`0246aa4`](https://github.com/Datzu712/Fidechat-backend/commit/0246aa40c4629aead0419ad48915587f8566b310) | IM GOING CRAZY |
| v2 | 2025-08-19 | `fa5f1cc` | [`ad6561a`](https://github.com/Datzu712/Fidechat-backend/commit/ad6561afce7f6c3cd8ddcae90ab45f06e8e9ee0b) | refactor: update message handling and repository methods, enhance DTO structure, and im… |
| v2 | 2025-08-19 | `0a50430` | [`281f7e4`](https://github.com/Datzu712/Fidechat-backend/commit/281f7e4a4d4fb272b604dd4ffd892fa164e9d5ba) | refactor: streamline function definitions and improve JSON handling in pkg_sync_data |
| v2 | 2025-08-19 | `27da42e` | [`876d758`](https://github.com/Datzu712/Fidechat-backend/commit/876d758d601eaec50f41967c53cbbc83cd27fab6) | feat: add createdAt parameter to message creation and update related methods |
| v2 | 2025-08-19 | `1c94e08` | [`4efebef`](https://github.com/Datzu712/Fidechat-backend/commit/4efebef17991210395503754e3f3bdbb866138b5) | fix: ensure createdAt is formatted as ISO string in message creation event |
| v2 | 2025-08-19 | `b6acb36` | [`ed17188`](https://github.com/Datzu712/Fidechat-backend/commit/ed171885d1db8e16430eae8e358de38812160bed) | idk |
| v2 | 2025-08-19 | `6bd5a90` | [`a69e271`](https://github.com/Datzu712/Fidechat-backend/commit/a69e2712a87187f1e99a88bdc4f730e1a4c1be8d) | feat: implement user status management with real-time updates |
| v2 | 2025-08-19 | `530ca7c` | [`6263ed5`](https://github.com/Datzu712/Fidechat-backend/commit/6263ed54ab6e237d23ac05c0342d0bd57afb3467) | refactor: update user status handling to use detailed metadata structure |
| v2 | 2025-08-19 | `51d1e99` | [`72c61e3`](https://github.com/Datzu712/Fidechat-backend/commit/72c61e3719aa3f531533d52700d22fd14c74abf6) | feat: integrate OpenAI API for AI command processing and add AI user models |
| v2 | 2025-08-19 | `b95352d` | [`aa6ea03`](https://github.com/Datzu712/Fidechat-backend/commit/aa6ea038236f4a0fc2eb2e659cb80da571ee1ad6) | fix: remove unnecessary prefix from Chayanne's response in AI command processing |
| v2 | 2025-08-19 | `ea4a9cc` | [`95c4c8d`](https://github.com/Datzu712/Fidechat-backend/commit/95c4c8d81cfbb7049635ca37ae9476d684be7bed) | fix: include IS_BOT field in related users JSON response |
| v2 | 2025-08-19 | `85a53d3` | [`5725cf7`](https://github.com/Datzu712/Fidechat-backend/commit/5725cf70d0938c39abb38e8f0b4d1928e0c48b99) | feat: add GET_PUBLIC_GUILDS procedure to PKG_GUILD for retrieving public guilds |
| v2 | 2025-08-19 | `5eb1d6b` | [`5b1e130`](https://github.com/Datzu712/Fidechat-backend/commit/5b1e130c4638bf2a3dd30a9f7b68f9da6162cd30) | feat: implement getPublicGuilds functionality in GuildController and GuildService |
| v2 | 2025-08-19 | `d80a060` | [`7abdaf1`](https://github.com/Datzu712/Fidechat-backend/commit/7abdaf1f02c94b3d38125813338f1136c7b26a63) | feat: add MESSAGE trigger for auditing message operations |
| v2 | 2025-08-19 | `6ced992` | [`8516984`](https://github.com/Datzu712/Fidechat-backend/commit/851698440e3899c4df6e167c5fec289ab29906b5) | readme updated |
| v2 | 2025-12-14 | `47bf684` | [`7ff1041`](https://github.com/Datzu712/Fidechat-backend/commit/7ff10413116e2d2d1eed90430c0387de97ac3869) | feat(tests): Added e2e test for auth flow and guild creation (including messaging via w… |

## fidechat-web → `apps/web`

| Versión | Fecha | Monorepo | Original | Mensaje |
| --- | --- | --- | --- | --- |
| v1 | 2024-11-27 | `c6ec011` | [`05cb0b3`](https://github.com/Datzu712/fidechat-web/commit/05cb0b3c8c136918e235ad03f1e53f087bab21d3) | first commit |
| v1 | 2024-11-27 | `afd8830` | [`d520b22`](https://github.com/Datzu712/fidechat-web/commit/d520b2247d9691128912d9c20d4e60741a81b8af) | eslint & prettier setup |
| v1 | 2024-11-27 | `3c34c7a` | [`846bd60`](https://github.com/Datzu712/fidechat-web/commit/846bd60c20a28ae0c3409f918001d2e7eba3bc14) | added eslint workflow |
| v1 | 2024-11-27 | `13f928d` | [`f4aad56`](https://github.com/Datzu712/fidechat-web/commit/f4aad561f4c1930b75e58aa7d43915758f36159a) | some code moved to components and websocket connection |
| v1 | 2024-11-27 | `21f6179` | [`2e8a754`](https://github.com/Datzu712/fidechat-web/commit/2e8a7543078c1e1d5b6155a3a120b43073a65f41) | docker |
| v1 | 2024-11-27 | `42d765b` | [`7a7db6e`](https://github.com/Datzu712/fidechat-web/commit/7a7db6e6424c35110b83d0658ce024a4ec1b70fc) | readme |
| v1 | 2024-11-28 | `a223166` | [`017f6b1`](https://github.com/Datzu712/fidechat-web/commit/017f6b16425a5b87b35f7ec5c876808bd9cdc585) | + deepsource |
| v1 | 2024-12-01 | `66cb299` | [`212b8b9`](https://github.com/Datzu712/fidechat-web/commit/212b8b946d88a6387954f7421ad09237d5d8fd8e) | cors fixed x2 |
| v1 | 2024-12-01 | `7f49177` | [`ec28d25`](https://github.com/Datzu712/fidechat-web/commit/ec28d25c65758e1e5783d2fc725a27ef2010a3cc) | add user, message, and channel interfaces; update login logic and add sidebar component |
| v1 | 2024-12-01 | `f7868d6` | [`9f34b41`](https://github.com/Datzu712/fidechat-web/commit/9f34b415deef453c3e8d209c9ef879a254661251) | refactor: reorganize imports, enhance websocket handling, and improve message rendering |
| v1 | 2024-12-02 | `be72cbe` | [`1980fa5`](https://github.com/Datzu712/fidechat-web/commit/1980fa546db9815a48ca6e949cf6583a97d70292) | eat: implement GlobalContext for user and channel management; |
| v1 | 2024-12-02 | `49c5356` | [`0126018`](https://github.com/Datzu712/fidechat-web/commit/0126018a455fb2ca40235704a8fb4bf86f38b997) | message event handling bugfix |
| v1 | 2024-12-08 | `75edb62` | [`87dbdc5`](https://github.com/Datzu712/fidechat-web/commit/87dbdc5e592c3819654b81edb5874bfed2d4ea45) | login refactor |
| v1 | 2024-12-09 | `72170ec` | [`ec96879`](https://github.com/Datzu712/fidechat-web/commit/ec96879dd6242978e74c7afa794c54bc6e4decb5) | code upgrade for best practices and readability |
| v1 | 2024-12-14 | `aa1f21c` | [`2afd89d`](https://github.com/Datzu712/fidechat-web/commit/2afd89d30cf714e2cce61065bf501704d0f7c7b2) | refactor: clean up imports, enhance websocket error handling, and add documentation for… |
| v1 | 2024-12-14 | `1400004` | [`0a9dd09`](https://github.com/Datzu712/fidechat-web/commit/0a9dd099945d25a432127e2bdbdce7b1631b607c) | removed .env |
| v1 | 2024-12-14 | `776591a` | [`747c67d`](https://github.com/Datzu712/fidechat-web/commit/747c67d9900c24f6ab5ed18ef907e4657ceb02e3) | added .env into gitignore |
| v1 | 2024-12-15 | `12d1615` | [`afd4385`](https://github.com/Datzu712/fidechat-web/commit/afd43851d4a9a87c4073a952d2348ed51a50c5b4) | refactor: update message handling and enhance UI components with new ChannelHeader and … |
| v1 | 2024-12-15 | `2a62830` | [`89900bc`](https://github.com/Datzu712/fidechat-web/commit/89900bc4ef5d5f4caa0713e74e924fe9d226110c) | + sass |
| v1 | 2024-12-15 | `d3a3be9` | [`829a25a`](https://github.com/Datzu712/fidechat-web/commit/829a25af99f1d3419c90953c0cc465912ec77578) | + 404 page |
| v1 | 2024-12-15 | `1392b8c` | [`3a6971b`](https://github.com/Datzu712/fidechat-web/commit/3a6971bbbcb2270b05f016452e8af0d287b3d673) | loading screen (todo) |
| v1 | 2024-12-15 | `faf677d` | [`18ea247`](https://github.com/Datzu712/fidechat-web/commit/18ea2477113f24a1afd43f6c6cbe5b2878c852fd) | user pfp bugfix |
| v1 | 2024-12-15 | `cc77fa9` | [`c2f8b51`](https://github.com/Datzu712/fidechat-web/commit/c2f8b514c0a4d047f60856fd8ec37732fb24be66) | deploy workflow |
| v1 | 2024-12-15 | `787bf55` | [`21dda35`](https://github.com/Datzu712/fidechat-web/commit/21dda3560b70f7beb8a60dd944872d5c581b0d5b) | workflow bugfix |
| v1 | 2024-12-15 | `fbc5ad7` | [`70772c0`](https://github.com/Datzu712/fidechat-web/commit/70772c01f5939c75eb35d01308debd2b7c522c9d) | workflow bugfix x2 |
| v1 | 2024-12-15 | `a09c661` | [`863873e`](https://github.com/Datzu712/fidechat-web/commit/863873eaeea2f039c6f65da9ce7d7dde548df6c2) | update deploy workflow to use npm instead of pnpm for dependency installation and build |
| v1 | 2024-12-15 | `a8803d9` | [`0b2caa6`](https://github.com/Datzu712/fidechat-web/commit/0b2caa612b47121f39ddad7ac8dfa6ee28540355) | test |
| v1 | 2024-12-16 | `b39b0f3` | [`eba1f3a`](https://github.com/Datzu712/fidechat-web/commit/eba1f3a93e4c314bdb2c01777faa3ce07243afc2) | removed dist folder (it will be included in gitignore) and added a dropdown for logout … |
| v1 | 2024-12-16 | `2820b29` | [`b4672c5`](https://github.com/Datzu712/fidechat-web/commit/b4672c53a04a1f269456758a9f5853cfc9432730) | status modal |
| v1 | 2024-12-16 | `3ffce8b` | [`c919629`](https://github.com/Datzu712/fidechat-web/commit/c919629dded174a5162d3d202ab52fc395d51eb8) | logout |
| v1 | 2024-12-16 | `e1c1094` | [`a8c6ba6`](https://github.com/Datzu712/fidechat-web/commit/a8c6ba6562a470aaee47b08222d20652e25bfa65) | websocket reconnection |
| v1 | 2024-12-16 | `0097d26` | [`9589f84`](https://github.com/Datzu712/fidechat-web/commit/9589f84eebde1c30ed89f7eec5fccf1e5e0a1688) | context menu update for channels |
| v1 | 2024-12-16 | `20303e2` | [`7bc85cf`](https://github.com/Datzu712/fidechat-web/commit/7bc85cf328f03abf49386a0981da43e73e7e2fc1) | edit channel |
| v1 | 2024-12-16 | `16cf6a4` | [`ca6be90`](https://github.com/Datzu712/fidechat-web/commit/ca6be90d20450d497f9cf2d2275c401fffe097b1) | add users |
| v1 | 2025-02-13 | `21033dd` | [`fcf352b`](https://github.com/Datzu712/fidechat-web/commit/fcf352bf99e123304e328dd78f47d920902ca6d2) | remove unused assets and clean up code |
| v2 | 2025-07-25 | `a1823e2` | [`dfcf600`](https://github.com/Datzu712/fidechat-web/commit/dfcf600c9779633fd8f79857ab829f1cfec58cdc) | Login authentication |
| v2 | 2025-07-25 | `c2147a3` | [`de14d27`](https://github.com/Datzu712/fidechat-web/commit/de14d27bceab92a4bb771df4ef5bab230af7cbf5) | Keycloak authentication |
| v2 | 2025-07-27 | `9eb5634` | [`97e6bff`](https://github.com/Datzu712/fidechat-web/commit/97e6bff0b2c9a1f21c3ea65604f971d02ca8d2fd) | + custom api hooks |
| v2 | 2025-07-27 | `ad421dd` | [`f088fc8`](https://github.com/Datzu712/fidechat-web/commit/f088fc8bedfaf4f51b365abd2cdc0800f034e287) | Refactor authentication handling and integrate API data fetching |
| v2 | 2025-08-02 | `742c673` | [`9f7df9f`](https://github.com/Datzu712/fidechat-web/commit/9f7df9fdbc4ceee75df8106c91b40919bbbd38c7) | Add SocketProvider and context for real-time communication; refactor Providers to inclu… |
| v2 | 2025-08-10 | `ff217b8` | [`c9c4210`](https://github.com/Datzu712/fidechat-web/commit/c9c4210e51bc392503206816d7d53fadba7c9712) | + project base moved into src and a lot of changes realted to backend communication |
| v2 | 2025-08-10 | `4be6b59` | [`36b1e6d`](https://github.com/Datzu712/fidechat-web/commit/36b1e6dbea2b21a6297e8575e45b8d03ecd27562) | + updated typescript type alias |
| v2 | 2025-08-10 | `7f16afe` | [`8eccafb`](https://github.com/Datzu712/fidechat-web/commit/8eccafb81a04f4512f433069da29c68d65241e09) | feat: Guilds sidebar now is using the data provided from the api |
| v2 | 2025-08-11 | `ab593d6` | [`f8f4bfc`](https://github.com/Datzu712/fidechat-web/commit/f8f4bfce44708f544e590a6b177aaccb7301e5c8) | feat: implement create server modal with API integration and socket event handling |
| v2 | 2025-08-11 | `053c9a6` | [`6460cbc`](https://github.com/Datzu712/fidechat-web/commit/6460cbc865b3814d2fac1d5ba762e08c303ab990) | feat: routing refactor; Moved some plain objects and functions to useCallback and useMemo |
| v2 | 2025-08-11 | `089ca21` | [`eabf1b8`](https://github.com/Datzu712/fidechat-web/commit/eabf1b80e6af401c6722044f3945e97aee75aa47) | feat: Selecting servers now is working :) |
| v2 | 2025-08-11 | `d0d2154` | [`7984443`](https://github.com/Datzu712/fidechat-web/commit/79844430a05f301f38249b66e551cdffa67c4e5a) | feat: update redirection paths from channels to servers and improve logout flow |
| v2 | 2025-08-11 | `79d9a5f` | [`413c19d`](https://github.com/Datzu712/fidechat-web/commit/413c19d234bfe4f7457cab54eed149663c0845e6) | feat: refactor channel and server modals with form validation and API integration; upda… |
| v2 | 2025-08-12 | `0bb35cb` | [`e4a5bcd`](https://github.com/Datzu712/fidechat-web/commit/e4a5bcdaf7ca68aebee18e7618f204b2681834cb) | feat: sort channels by position in ChannelSidebar; update socket event names for consis… |
| v2 | 2025-08-12 | `1395646` | [`6ad76fd`](https://github.com/Datzu712/fidechat-web/commit/6ad76fdb1df3313aa6a5f9e3e8db1683fbd20068) | type shii |
| v2 | 2025-08-18 | `e30f93c` | [`cc56ea3`](https://github.com/Datzu712/fidechat-web/commit/cc56ea30f800c59de8db23931f576499e471b75d) | Merge pull request #6 from Datzu712/feature/refactor |
| v2 | 2025-08-19 | `63d8b34` | [`9eb97af`](https://github.com/Datzu712/fidechat-web/commit/9eb97afc3a7297df33cee62b172da05c57a858cb) | feat: enhance chat functionality with message handling and socket events; refactor chan… |
| v2 | 2025-08-19 | `69d0be3` | [`59d07f1`](https://github.com/Datzu712/fidechat-web/commit/59d07f1fa441a473fc690c6b5168458aea452af0) | Merge pull request #7 from Datzu712/feature/refactor |
| v2 | 2025-08-19 | `23c9a41` | [`a7ebc8c`](https://github.com/Datzu712/fidechat-web/commit/a7ebc8cb3dca9cf28da9be98ec05e2fd92a89b50) | feat: update socket connection to use NEXT_PUBLIC_SOCKET_URL instead of NEXT_PUBLIC_RES… |
| v2 | 2025-08-19 | `62e0719` | [`09c33e8`](https://github.com/Datzu712/fidechat-web/commit/09c33e8090c9233d490675bc624e973e2566c68d) | feat: refactor socket event handling to use constants for event names |
| v2 | 2025-08-19 | `18f3d14` | [`f147104`](https://github.com/Datzu712/fidechat-web/commit/f147104a0152da3806d730ae99e6fdb6593803c8) | feat: implement message editing and deletion functionality in chat area; add delete mes… |
| v2 | 2025-08-19 | `29aab96` | [`b2932c5`](https://github.com/Datzu712/fidechat-web/commit/b2932c5eafd0253ad68f1e07cb7f8d504b2088e8) | feat: add channel creation button for admins and implement modal for creating new channels |
| v2 | 2025-08-19 | `5a3ea54` | [`13703d1`](https://github.com/Datzu712/fidechat-web/commit/13703d17951a8e438a78ddf7de1c58693a3e8f01) | feat: add emoji picker functionality to chat area; update message input to support emoj… |
| v2 | 2025-08-19 | `e8762b2` | [`b2a1e21`](https://github.com/Datzu712/fidechat-web/commit/b2a1e2121e4cd0c652ce504696b07fff96ed6943) | feat: remove debug logging and pass userId to ChatArea component |
| v2 | 2025-08-19 | `02173f6` | [`cc17306`](https://github.com/Datzu712/fidechat-web/commit/cc17306c1a0f90f967ffd05b40f83b571fb70af6) | feat: simplify socket event logging by removing development environment check |
| v2 | 2025-08-19 | `9ede64b` | [`55fad5d`](https://github.com/Datzu712/fidechat-web/commit/55fad5d50f9f8c886df2347d9c48e71d28a72004) | feat: enhance socket event logging with consistent prefix for outgoing events |
| v2 | 2025-08-19 | `e2a0d72` | [`61e2ceb`](https://github.com/Datzu712/fidechat-web/commit/61e2ceb3c1876ad1f5935c42a739bb000514b8cc) | feat: ensure currentUser is added to users state if not already present and fixed membe… |
| v2 | 2025-08-19 | `b1c125d` | [`d3146e1`](https://github.com/Datzu712/fidechat-web/commit/d3146e1ab23c6de6d504b5444e0d687edd3c90e4) | feat: implement user status management with real-time updates and status selection in s… |
| v2 | 2025-08-19 | `b5a519d` | [`b750d40`](https://github.com/Datzu712/fidechat-web/commit/b750d409f072a6d35e9eb014fd91d2dfae6136d3) | feat: add framer-motion dependency and implement typing status in chat area with user s… |
| v2 | 2025-08-19 | `eb70023` | [`dc3c6f4`](https://github.com/Datzu712/fidechat-web/commit/dc3c6f411366c0592ce48170230b1622daa1aff2) | feat: add bot label to members and improve member filtering in sidebar |
| v2 | 2025-08-19 | `1c6054a` | [`ff16d3d`](https://github.com/Datzu712/fidechat-web/commit/ff16d3d1f17909f125f5cca84dcddcfc97980c67) | fix: prevent bot status from rendering "0" in members sidebar by coercing isBot to boolean |
| v2 | 2025-08-19 | `ea2669f` | [`086d0da`](https://github.com/Datzu712/fidechat-web/commit/086d0da2a93d14561d76512f96cb46f74cc68852) | feat: add DiscoverServersModal component and integrate it into ServerSidebar for server… |
| v2 | 2025-08-19 | `5858787` | [`525180e`](https://github.com/Datzu712/fidechat-web/commit/525180e09f3c7af256c3b8614db27565334a428b) | fix: comment out unused window.open functionality in ChannelSidebar |
| v2 | 2025-08-19 | `ddcd894` | [`0a518c1`](https://github.com/Datzu712/fidechat-web/commit/0a518c1b5061da40c1eab1625c90732edadd6716) | feat: add initial README.md with project overview, features, tech stack, and installati… |
