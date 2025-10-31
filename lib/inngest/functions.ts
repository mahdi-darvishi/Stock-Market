import { inngest } from "@/lib/inngest/client";
import { sendWelcomeEmail } from "../nodemailer";

export const sendSignUpEmail = inngest.createFunction(
  { id: "sign-up-email" },
  { event: "app/user.created" },
  async ({ event, step }) => {
    const introText =
      '<p class="mobile-text" style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">' +
      "Thanks for joining Signalist. You now have the tools to track markets and make smarter moves. We'll help you spot opportunities before they become mainstream news." +
      "</p>";

    await step.run("send-welcome-email", async () => {
      const {
        data: { email, name },
      } = event;

      return await sendWelcomeEmail({
        email,
        name,
        intro: introText,
      });
    });

    return {
      success: true,
      message: "Welcome email sent successfully (Static)",
    };
  }
);
