-- Enable RLS on all user-owned tables
ALTER TABLE "SmtpAccount" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Recruiter" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Resume" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Campaign" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmailTemplate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmailLog" ENABLE ROW LEVEL SECURITY;

-- Create policies assuming app.current_user_id is set in the session
CREATE POLICY "SmtpAccount_policy" ON "SmtpAccount" FOR ALL USING ("userId" = current_setting('app.current_user_id'));
CREATE POLICY "Recruiter_policy" ON "Recruiter" FOR ALL USING ("userId" = current_setting('app.current_user_id'));
CREATE POLICY "Resume_policy" ON "Resume" FOR ALL USING ("userId" = current_setting('app.current_user_id'));
CREATE POLICY "Campaign_policy" ON "Campaign" FOR ALL USING ("userId" = current_setting('app.current_user_id'));
CREATE POLICY "EmailTemplate_policy" ON "EmailTemplate" FOR ALL USING ("userId" = current_setting('app.current_user_id'));
CREATE POLICY "EmailLog_policy" ON "EmailLog" FOR ALL USING ("userId" = current_setting('app.current_user_id'));
