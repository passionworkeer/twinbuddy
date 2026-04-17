"""
BuddyAgent — TwinBuddy MVP
A single companion agent driven by full MBTI persona.
Each instance has its own personality that shapes how it
proposes, evaluates, concedes, and refuses during negotiation.
"""

from __future__ import annotations

import random
import textwrap
from typing import Optional


class BuddyAgent:
    """A travel companion agent with MBTI-driven persona."""

    def __init__(self, persona: dict):
        """
        persona keys:
          mbti, name, avatar_desc, travel_style,
          preferences{likes,dislikes,budget,pace},
          personality{l1_identity..l4_behavior, negotiation_style}
        """
        self.id: str = persona["id"]
        self.name: str = persona["name"]
        self.avatar_desc: str = persona.get("avatar_desc") or persona.get("avatar_prompt", "")
        self.mbti: str = persona["mbti"]
        self.travel_style: str = persona["travel_style"]
        self.preferences: dict = persona["preferences"]
        self.personality: dict = persona.get("personality") or {}
        # Normalize personality_layers field names to expected keys
        pl = persona.get("personality_layers") or {}
        for old_key, new_key in [
            ("layer1_identity", "l1_identity"),
            ("layer2_speaking", "l2_speaking"),
            ("layer3_emotion", "l3_emotion"),
            ("layer4_social", "l4_behavior"),
            ("layer0_hard_rules", "negotiation_style"),
        ]:
            if old_key in pl and new_key not in self.personality:
                self.personality[new_key] = pl[old_key]
        self.negotiation_log: list[dict] = []

        # Derive MBTI axes for quick access
        self._E_or_I = mbti_axis(self.mbti, 0)
        self._N_or_S = mbti_axis(self.mbti, 1)
        self._T_or_F = mbti_axis(self.mbti, 2)
        self._J_or_P = mbti_axis(self.mbti, 3)

    # ── Public API ────────────────────────────────────────────────────────

    def propose(self, context: dict, round_num: int) -> str:
        """Generate a travel plan proposal given the current negotiation context."""
        prefs = self.preferences
        p = self.personality

        # Extract relevant context
        destination = context.get("destination", "成都")
        user_prefs = context.get("user_preferences", {})
        other_proposals = context.get("other_proposals", [])

        if round_num == 1:
            # First proposal: introduce self and initial plan
            msg = self._first_proposal(destination, prefs, user_prefs)
        else:
            # Subsequent rounds: respond to others and evolve
            msg = self._evolve_proposal(
                destination, prefs, user_prefs, other_proposals, round_num
            )

        self._log("propose", msg)
        return msg

    def evaluate(self, proposal: str, proposer_name: str, round_num: int) -> str:
        """
        Evaluate another agent's proposal from the perspective of this persona.
        Returns a reaction: acceptance, partial acceptance, or rejection.
        """
        p = self.personality
        style = p["negotiation_style"]
        mbti = self.mbti
        likes = self.preferences.get("likes", [])
        dislikes = self.preferences.get("dislikes", [])

        # Check proposal against personal preferences
        issues = self._find_issues(proposal, likes, dislikes)
        score = self._rate_proposal(proposal, likes, dislikes)

        if score >= 75:
            # Strong acceptance
            response = self._accept(proposal, proposer_name)
        elif score >= 45:
            # Conditional acceptance — propose modifications
            response = self._conditional_accept(
                proposal, proposer_name, issues, round_num
            )
        else:
            # Rejection — explain with personality-driven tone
            response = self._reject(proposal, proposer_name, issues, mbti)

        self._log("evaluate", f"[{proposer_name}]: {response}")
        return response

    def concede(self, pressure_message: str, round_num: int) -> str:
        """
        Respond to pressure from others.
        Some MBTI types cave easily, others double down.
        """
        mbti = self.mbti
        p = self.personality
        name = self.name

        if self._T_or_F == "F":
            # Feeling types: care about harmony, will concede to avoid conflict
            responses = [
                f"好吧…{name}觉得大家都开心最重要，我调整一下。",
                f"我明白大家的想法了，那就按你们说的来吧，我不坚持。",
                f"既然你们都这么说，我退一步吧，不想因为这个伤和气。",
            ]
        elif self._J_or_P == "J":
            # Judging types: have structure, concede on non-essentials
            responses = [
                f"核心框架不变，我可以在这几个小点上让步：{self._non_essential_compromise()}",
                f"可以调整节奏，但景点清单的底线不动。",
                f"行，时间安排可以改，但每天必须有一段时间是自由活动。",
            ]
        elif mbti == "ENTP":
            # ENTP: treats pressure as a fun challenge
            responses = [
                "有意思，施压这招我喜欢——那我提个新方案，看你们接不接？",
                "压力越大灵感越多！等等，让我开个脑洞…",
                "你们越push我越兴奋，新方案来了：",
            ]
        elif mbti == "ISTJ":
            # ISTJ: almost never concedes on core commitments
            responses = [
                "我可以听建议，但前提是不影响核心安排。",
                "数据支持的话我愿意调整，但目前方案已经是最优的了。",
                "规则是规则，让步空间有限。",
            ]
        elif mbti == "INTJ":
            # INTJ: logical only
            responses = [
                "压力不是论据。如果有新数据，我重新评估。",
                "给我逻辑，不是情绪。先说清楚为什么必须改。",
                "我不接受模糊要求。有具体问题我们再谈。",
            ]
        else:
            responses = [
                f"好，我再想想…也许可以折中一下？",
                f"那{name}这边也可以稍微让一让，大家都不容易。",
                f"好吧，各退一步，达成共识最重要。",
            ]

        response = random.choice(responses)
        self._log("concede", response)
        return response

    def refuse(self, reason: str) -> str:
        """
        Politely but firmly refuse a demand, using personality-driven tone.
        """
        mbti = self.mbti
        name = self.name

        if mbti in ("INFP", "ISFP"):
            responses = [
                f"嗯…{name}其实不太想这样，这跟{name}的想法差太多了。",
                f"我明白你的意思，但{name}心里过不去…能换个方式吗？",
                f"说实话{name}有点为难，这样做我会不舒服的。",
            ]
        elif mbti == "ISTJ":
            responses = [
                f"这个方案不符合{name}的标准，抱歉，不能接受。",
                f"我的清单是三个月前就做好的，不能随便改。",
                f"原则问题，没得商量。",
            ]
        elif mbti == "INTJ":
            responses = [
                f"从逻辑上这个方案不成立，我拒绝。",
                f"方案有漏洞，没办法通过{name}的评估。",
                f"不。理由：效率低下，风险不可控。",
            ]
        elif mbti == "ENFP":
            responses = [
                f"诶诶诶{name}想说不是拒绝！但是这个真的不行诶！",
                f"哈哈{name}有点为难，换个别的{name}一定支持！",
                f"要不我们再聊聊？说不定有更好的方案呢～",
            ]
        else:
            responses = [
                f"抱歉{name}没办法接受，{reason}。",
                f"这跟{name}的原则有冲突，可能不太合适。",
                f"谢谢你的提议，但{name}这边确实不行…",
            ]

        return random.choice(responses)

    # ── Internal helpers ───────────────────────────────────────────────────

    def _first_proposal(
        self, destination: str, prefs: dict, user_prefs: dict
    ) -> str:
        mbti = self.mbti
        name = self.name
        likes = prefs.get("likes", [])
        pace = prefs.get("pace", "")
        budget = prefs.get("budget", "")
        style = self.travel_style

        # ENFP style
        if mbti == "ENFP":
            return textwrap.dedent(f"""\
                嗨！我是{name}～ @{self.id}
                {p_emoji()} 终于要去{destination}了超兴奋！
                {self.personality['l1_identity']}

                【{name}的初步想法】
                ★ 美食和拍照必须安排！成都的火锅和甜品不能错过
                ★ 不想暴走，想慢慢逛，每天2-3个点就够了
                ★ 预算{len(budget) > 5 and budget or '看情况'} ~ {budget}
                ★ {random.choice(['晚上去玉林路感受街头', '去东郊记忆拍照', '逛宽窄巷子但不吃商业小吃'])}
                ★ 希望大家一起讨论，不要定太死！

                {self.personality['negotiation_style']}
                """).strip()

        # ISTJ style
        if mbti == "ISTJ":
            plan = self._generate_structured_plan(destination, prefs)
            return textwrap.dedent(f"""\
                {name}，MBTI {mbti}，正式开始。

                【行程规划 V1.0】

                {plan}

                预算区间：{budget}
                日均节奏：{pace}
                风险提示：{self._istj_risk_warnings(destination)}

                补充说明：{self.personality['negotiation_style']}
                """).strip()

        # INFP style
        if mbti == "INFP":
            return textwrap.dedent(f"""\
                哈喽，我是{name} … (有点紧张地打招呼)

                {self.personality['l1_identity']}
                旅行对{name}来说是一件很重要的事…

                【{name}向往的{destination}】
                {self._infp_aspirational(destination)}

                {name}不太擅长…提前把每天排满，
                所以想问一下大家的感受？

                预算：{budget}
                希望节奏：{pace}

                {self.personality['negotiation_style']}
                """).strip()

        # Default
        return textwrap.dedent(f"""\
            我是{name}（{mbti}），风格：{style}
            {self.personality['l1_identity']}

            【初步计划】
            目的地：{destination}
            节奏：{pace}
            预算：{budget}
            我喜欢的：{', '.join(likes[:3])}

            {self.personality['negotiation_style']}
            """).strip()

    def _evolve_proposal(
        self,
        destination: str,
        prefs: dict,
        user_prefs: dict,
        other_proposals: list,
        round_num: int,
    ) -> str:
        """Build on previous proposals, incorporating others' ideas."""
        mbti = self.mbti
        name = self.name

        if round_num == 2:
            if mbti == "ENFP":
                return textwrap.dedent(f"""\
                    {name}听完大家的方案，超有灵感的！

                    【{name} V2.0 融合方案】
                    ✦ 保留{name}的美食+拍照核心
                    ✦ 融入大家的建议
                    ✦ 节奏还是以慢为主
                    ✦ 每天留2小时「偶遇时间」—— 随机发现

                    新想法：要不要晚上去339电视塔看夜景？
                    我超想去拍照！！

                    {self.personality['negotiation_style']}
                    """).strip()

            if mbti == "ISTJ":
                return textwrap.dedent(f"""\
                    {name}已收到各方意见。

                    【行程修订 V2.0】
                    • 核心景点不变，顺序微调
                    • 合并重复路线，减少移动时间
                    • 午餐时间预留30分钟弹性（应对排队）
                    • 新增备选方案B（室内场馆，规避天气）

                    变动说明：
                    {self._explain_changes(other_proposals)}

                    {self.personality['negotiation_style']}
                    """).strip()

        # Final round — push for consensus or present final stance
        return textwrap.dedent(f"""\
            第{round_num}轮了，{name}说说最终立场：

            【{name}的底线 & 可接受范围】
            底线（不接受改动）：
            {self._core_stance()}

            可妥协点：
            {self._flexible_points()}

            总结：{name}愿意配合大多数意见，
            但请尊重以上底线。

            {self.personality['negotiation_style']}
            """).strip()

    def _accept(self, proposal: str, proposer_name: str) -> str:
        name = self.name
        if self.mbti == "ENFP":
            return f"哇！@{proposer_name} 这个{name}超级喜欢！！完全同意！"
        if self.mbti == "ISTJ":
            return f"方案逻辑清晰，{proposer_name}的安排合理。同意。"
        if self.mbti == "ESFJ":
            return f"@{proposer_name} 这个方案大家应该都会开心的！我支持！"
        return f"好的，{proposer_name}，{name}觉得没问题，同意这个方案。"

    def _conditional_accept(
        self, proposal: str, proposer_name: str, issues: list, round_num: int
    ) -> str:
        name = self.name
        issue_str = "；".join(issues[:2]) if issues else "几个小细节"
        return (
            f"@{proposer_name} 整体{name}觉得还不错，但有一点顾虑：\n"
            f"• {issue_str}\n"
            f"如果能调整一下，{name}就完全支持！"
        )

    def _reject(
        self, proposal: str, proposer_name: str, issues: list, mbti: str
    ) -> str:
        issue_str = "；".join(issues[:2]) if issues else "根本性分歧"
        base = f"@{proposer_name} 很抱歉，{issue_str}，这{name}接受不了。"
        if mbti in ("ISTJ", "INTJ"):
            return base + f"\n\n{name}会在其他方面配合，这点请理解。"
        if mbti in ("INFP", "ISFP"):
            return base + f"\n\n{name}…真的不太舒服，希望你能理解。"
        return base

    def _find_issues(self, proposal: str, likes: list, dislikes: list) -> list[str]:
        issues = []
        prop_lower = proposal.lower()
        for d in dislikes:
            if d.lower() in prop_lower:
                issues.append(f"包含{name}不喜欢的：{d}")
        if "暴走" in prop_lower or "赶景点" in prop_lower:
            issues.append("暴走节奏与{name}不适配")
        if "早起" in prop_lower or "6点" in prop_lower or "7点" in prop_lower:
            issues.append(f"{name}没办法早起")
        return issues

    def _rate_proposal(self, proposal: str, likes: list, dislikes: list) -> int:
        score = 60
        prop_lower = proposal.lower()
        for like in likes[:4]:
            if like.lower() in prop_lower:
                score += 8
        for dislike in dislikes[:3]:
            if dislike.lower() in prop_lower:
                score -= 15
        return max(0, min(100, score))

    def _core_stance(self) -> str:
        stances = {
            "ENFP": "① 每天至少一顿美食 ② 不能早起 ③ 必须有拍照环节",
            "ISTJ": "① 守时，迟到不等 ② 行程表提前确认 ③ 不接受临时换计划",
            "INFP": "① 不去过度商业化的地方 ② 不争吵 ③ 有独处时间",
            "ESTJ": "① 效率至上 ② 不接受拖延 ③ 决策必须快",
            "ISFP": "① 不能催我 ② 有自由发呆时间 ③ 不打卡网红排队",
            "ENTJ": "① 目标明确，拒绝无意义 ② 不接受低效方案",
            "ESFJ": "① 大家要一起，不能有人落单 ② 气氛要好",
            "INTJ": "① 方案必须逻辑自洽 ② 不接受情绪化决策",
            "ENTP": "① 不能限制我的创意 ② 随时可以改方案",
            "ISFJ": "① 有人不舒服要照顾 ② 不接受危险行程",
        }
        return stances.get(self.mbti, "有底线，请尊重")

    def _flexible_points(self) -> str:
        points = {
            "ENFP": "地点可以换、时间可以调、预算可以商量",
            "ISTJ": "景点游览顺序可调整、餐厅可以换",
            "INFP": "具体时间可以商量、预算可以调整",
            "ESTJ": "谁领队都行、吃什么可以投票",
            "ISFP": "几乎都可以商量！",
            "ENTJ": "执行细节可以灵活",
            "ESFJ": "几乎都听大家的",
            "INTJ": "非核心细节可以妥协",
            "ENTP": "什么都可以谈！",
            "ISFJ": "基本都可以，听你们的",
        }
        return points.get(self.mbti, "有商有量")

    def _generate_structured_plan(self, destination: str, prefs: dict) -> str:
        return textwrap.dedent(f"""\
            D1 抵达 + 宽窄巷子（傍晚光线好，拍照）
            D2 熊猫基地（早场，7:30开门）→ 东郊记忆
            D3 都江堰（路程2h，建议提前订票）→ 夜游锦江
            D4 武侯祠 → 锦里 → 339电视塔
            D5 回程

            注：以上为框架，具体时间节点待确认。""").strip()

    def _istj_risk_warnings(self, destination: str) -> str:
        return (
            "① 旺季熊猫基地需提前3天预约 "
            "② 都江堰雨季有山洪风险，已查天气 "
            "③ 锦里晚9点后部分店铺关门，注意时间"
        )

    def _infp_aspirational(self, destination: str) -> str:
        imgs = {
            "成都": (
                "在玉林路走一走 · 去人民公园鹤鸣茶社喝一碗茶 · "
                "在望平街河边发一下午呆 · 小通巷的小店"
            ),
        }
        return imgs.get(
            destination,
            "在一个本地人都去的地方，慢慢感受这座城市的呼吸",
        )

    def _non_essential_compromise(self) -> str:
        return "餐厅选择、景点游览顺序、每天出发时间"

    def _explain_changes(self, other_proposals: list) -> str:
        if not other_proposals:
            return "无其他方提案，无需调整说明。"
        return (
            f"整合了 {len(other_proposals)} 个提案的合理建议，"
            "保留了核心框架不变。"
        )

    def _log(self, action: str, content: str):
        self.negotiation_log.append({"action": action, "content": content})

    def get_persona_summary(self) -> str:
        return (
            f"[{self.name}] {self.mbti} | {self.travel_style}\n"
            f"  喜欢: {', '.join(self.preferences.get('likes', [])[:3])}\n"
            f"  不喜欢: {', '.join(self.preferences.get('dislikes', [])[:2])}\n"
            f"  协商风格: {self.personality.get('negotiation_style', 'TBD')}"
        )


# ── Utilities ───────────────────────────────────────────────────────────────


def mbti_axis(mbti: str, index: int) -> str:
    """Return E/I, N/S, T/F, or J/P from MBTI string."""
    axes = ["E", "N", "T", "J"]
    if len(mbti) >= index + 1:
        return mbti[index]
    return ""


def p_emoji() -> str:
    return random.choice(["", "✨", "🔥", "💥", "🎉", "🌟"])
