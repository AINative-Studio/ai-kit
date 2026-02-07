# Moderation Guide for AI Kit Community

This guide is for Core Team members and Community Helpers who moderate the AI Kit Discord server.

## Moderation Philosophy

Our approach to moderation:

1. **Prevention First** - Clear guidelines prevent most issues
2. **Education Over Punishment** - Help people learn expectations
3. **Proportional Response** - Match action to severity
4. **Consistency** - Apply rules fairly to everyone
5. **Transparency** - Explain decisions when appropriate
6. **Privacy** - Handle issues discreetly when possible

## Moderator Responsibilities

### Core Team (Administrators)

- Overall server management and configuration
- Handle serious violations and ban decisions
- Manage roles and permissions
- Review moderation actions
- Update server guidelines
- Coordinate with AINative Studio team

### Community Helpers

- Monitor #help, #general, and #showcase
- Answer questions and guide discussions
- Issue warnings for minor violations
- Escalate serious issues to Core Team
- Welcome new members
- Model good community behavior

## Common Situations

### Spam and Low-Quality Content

**Automated Detection:**
- Bot removes 5+ messages per minute
- Excessive caps lock, mentions, or emojis
- Unauthorized link domains

**Manual Actions:**
- Delete spam messages
- Warning for first offense
- Temporary mute for repeat spam (30-60 minutes)
- Ban for bot accounts or persistent spam

**Example Warning:**
```
@user Please avoid posting repetitive messages.
Check #help for assistance or wait for responses. Thanks!
```

### Off-Topic Discussions

**When to Allow:**
- Brief tangents in #general
- Relevant technical discussions
- Community bonding in #off-topic

**When to Redirect:**
- Extended non-AI Kit conversations in #help
- Political or controversial topics
- Sales pitches or job postings

**How to Redirect:**
```
@user Let's move this conversation to #off-topic to keep
this channel focused on [purpose]. Thanks!
```

### Requesting Help

**Good Help Requests:**
- Clear problem statement
- Code examples and errors
- Environment information
- What they've already tried

**Poor Help Requests:**
- "It doesn't work" (too vague)
- "Do my project for me"
- "Here's 500 lines of code, fix it"
- No response to clarifying questions

**Moderator Actions:**
- Guide them to write better questions
- Share the help template from guidelines
- Connect them with relevant documentation
- Ask clarifying questions to help narrow the issue

**Template Response:**
```
@user To help you better, please provide:
1. Exact error message
2. AI Kit version you're using
3. Minimal code example that reproduces the issue
4. What you expected vs what happened

Check out our help guidelines: [link]
```

### Self-Promotion

**Allowed:**
- Sharing projects built with AI Kit in #showcase
- Mentioning companies using AI Kit in context
- Blog posts or tutorials about AI Kit
- Open source projects that integrate AI Kit

**Not Allowed:**
- Unsolicited job postings
- Advertising unrelated products/services
- Referral links or affiliate marketing
- Repeated promotion of the same project

**Moderator Actions:**
- Delete commercial spam immediately
- For borderline cases, ask them to share in #showcase
- Permanent ban for persistent marketers

### Code of Conduct Violations

#### Tier 1: Minor Issues
Examples: Brief rudeness, mild profanity, impatience

**Action:** Private warning via DM
```
Hi @user, I noticed [behavior] in #channel.
This doesn't align with our community guidelines around [value].
Please review our guidelines: [link]
Let me know if you have questions!
```

#### Tier 2: Moderate Issues
Examples: Repeated rudeness, heated arguments, disrespecting others

**Action:**
1. Public reminder in channel
2. Temporary mute (1-24 hours)
3. Private DM explaining why
4. Log incident in mod channel

```
@user Taking a break from the server for [duration] to
review our community guidelines. We can discuss via DM.
```

#### Tier 3: Serious Issues
Examples: Harassment, hate speech, doxxing, threats

**Action:**
1. Immediate ban
2. Report to Discord Trust & Safety
3. Document evidence
4. Notify Core Team
5. Review if alt accounts appear

No warning required for serious violations.

### Technical Support Escalation

When users need more help than Discord can provide:

1. **Check Documentation** - Link to relevant docs
2. **Search Issues** - Check if it's a known bug
3. **Create GitHub Issue** - For bugs or feature requests
4. **Tag Experts** - Mention Core Team if needed (sparingly)
5. **Suggest Workarounds** - Share temporary solutions

**Escalation Template:**
```
@user This looks like a potential bug. Can you:
1. Create a GitHub issue: [link]
2. Include a minimal reproduction
3. Tag it with 'bug' label

This helps the Core Team investigate properly!
```

## Moderation Tools

### Discord Features

**Timeout (Temporary Mute)**
- Right-click user > Timeout
- Durations: 60s, 5m, 10m, 1h, 1d, 1w
- Use for cooling-off periods

**Kick**
- Removes from server, can rejoin with invite
- Rarely used - prefer timeout or ban

**Ban**
- Permanent removal from server
- Option to delete recent messages (7 days max)
- Use for serious violations only

**Slow Mode**
- Limit message frequency in channels
- Useful during heated discussions
- Enable in Channel Settings > Overview

**Message Management**
- Delete individual messages
- Bulk delete with bots (up to 100 messages)
- Pin important announcements

### Bot Commands

Our moderation bot provides:

**Auto-Moderation:**
- Spam detection
- Link filtering
- Caps/emoji limits
- Profanity filter

**Manual Commands:**
```
!warn @user reason          - Issue warning
!mute @user duration reason - Temporary mute
!unmute @user              - Remove mute
!history @user             - View mod history
!logs #channel count       - Review recent messages
```

**Analytics:**
```
!stats                     - Server activity stats
!active                    - Most active members
!reports                   - Recent reports summary
```

## Logging and Documentation

### What to Log

- All warnings, mutes, and bans
- Context and reasoning
- Evidence (screenshots if needed)
- Resolution or follow-up

### Where to Log

- **#mod-logs** channel (automated)
- Internal spreadsheet for pattern tracking
- Core Team communication channel

### Log Format

```
Date: 2026-02-07
User: @username#1234 (ID: 123456789)
Violation: Spam in #general
Action: Timeout 1 hour
Context: Posted same message 8 times in 2 minutes
Moderator: @modname
Notes: First offense, seemed unintentional, explained rules
```

## Conflict Resolution

### Between Community Members

1. **Assess Severity**
   - Minor disagreement: Let them work it out
   - Heated argument: Step in and de-escalate
   - Personal attacks: Immediate timeout

2. **De-escalation Steps**
   - Ask both parties to step back
   - Move to DMs if needed
   - Remind of community guidelines
   - Offer cooling-off period

3. **Mediation**
   - Listen to both perspectives
   - Find common ground
   - Focus on behavior, not personalities
   - Agree on path forward

### Between User and Moderator

1. **Stay Professional**
   - Don't take it personally
   - Remain calm and factual
   - Avoid arguing in public channels

2. **Escalate if Needed**
   - Involve another moderator
   - Get Core Team input
   - Document everything

3. **Review Process**
   - Users can appeal bans to Core Team
   - Appeals reviewed within 48 hours
   - Decisions explained with evidence

## Edge Cases

### False Positives

Bot incorrectly flags legitimate content:
- Manually review and restore if appropriate
- Apologize to user
- Adjust bot configuration if pattern appears
- Document for bot improvements

### Moderator Disagreements

Moderators have different interpretation of rules:
- Discuss privately in mod channel
- Defer to Core Team for precedent
- Update guidelines if ambiguous
- Present united front to community

### VIP or Notable Users

Famous developers, influencers, or partners:
- Apply same rules as everyone else
- No special treatment for violations
- May have higher visibility, act accordingly
- Represent AI Kit well to their audiences

### Organized Harassment or Raids

Coordinated attacks from outside groups:
- Enable slow mode and verification
- Mass ban obvious raiders
- Report to Discord Trust & Safety
- Temporary lockdown of channels if needed
- Notify Core Team immediately

## Burnout Prevention

Moderation can be draining. Take care of yourself:

### Set Boundaries

- You're not on-call 24/7
- Take breaks and days off
- Don't moderate when stressed
- Share load with other mods

### Ask for Help

- Tag another mod if overwhelmed
- Escalate difficult situations
- Discuss challenges in mod channel
- It's okay to say "I need backup"

### Self-Care

- Mute notifications when off-duty
- Step away from heated situations
- Don't internalize negativity
- Remember most members are great!

## Continuous Improvement

### Regular Reviews

Monthly moderation meetings to discuss:
- Trends in violations
- Effectiveness of current rules
- Bot configuration adjustments
- Moderator feedback and training
- Community sentiment

### Community Feedback

- Listen to member concerns
- Adjust guidelines when needed
- Transparency about changes
- Balance consistency with flexibility

### Training

- Onboarding for new Community Helpers
- Regular check-ins and coaching
- Share challenging situations for learning
- Celebrate good moderation work

## Quick Reference

### Response Times

- Serious violations: Immediate
- Spam/off-topic: Within minutes
- Help requests: Best effort, no SLA
- Appeals: Within 48 hours

### Action Authority

**Community Helpers Can:**
- Delete messages
- Issue warnings
- Timeout up to 1 hour
- Escalate to Core Team

**Community Helpers Cannot:**
- Ban users
- Change server settings
- Manage roles
- Make policy decisions

### When to Escalate

Escalate to Core Team for:
- Ban decisions
- Repeat offenders
- Unclear situations
- Policy questions
- Serious violations
- Appeals

## Resources

- [Community Guidelines](./guidelines.md)
- [Discord Moderation Docs](https://discord.com/moderation)
- #mod-channel for questions
- Core Team for escalations

## Thank You

Thank you for helping make AI Kit a welcoming community. Your volunteer efforts make this space valuable for thousands of developers.

**Moderate with empathy, enforce with consistency, lead with example.**
