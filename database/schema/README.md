# TwinBuddy Database Schema Pack

这个文件夹给后续真实部署准备，按 PostgreSQL / Supabase 方言组织。

## 文件顺序
1. `00_extensions.sql`
2. `10_users_auth_profiles.sql`
3. `20_matching_and_negotiation.sql`
4. `30_blind_games_and_messages.sql`
5. `40_community_and_social.sql`
6. `50_safety_and_ops.sql`

## 设计原则
- 先满足 TwinBuddy V2 主链路：认证、画像、匹配、盲选、私信、社区、安全。
- 实名服务商暂未接入，但数据库字段和状态位已预留。
- 所有敏感字段只做存储位预留，不在前端直出；真实部署时建议配合 KMS/列级加密。
- UUID 统一使用 `gen_random_uuid()`，时间统一用 `timestamptz`。

## 推荐部署顺序
```sql
\i 00_extensions.sql
\i 10_users_auth_profiles.sql
\i 20_matching_and_negotiation.sql
\i 30_blind_games_and_messages.sql
\i 40_community_and_social.sql
\i 50_safety_and_ops.sql
```
