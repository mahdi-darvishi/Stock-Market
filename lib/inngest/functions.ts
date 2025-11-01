import { inngest } from "@/lib/inngest/client";
import { sendNewsSummaryEmail, sendWelcomeEmail } from "../nodemailer";
import { getAllUsersForNewsEmail } from "../actions/user.actions";
import { getWatchlistSymbolsByEmail } from "../actions/watchlist.actions";
import { getNews } from "../actions/finnhub.actions";
import { getFormattedTodayDate } from "../utils";

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

export const sendDailyNewsSummary = inngest.createFunction(
  { id: "daily-news-summary" },
  // Run this function every day at 4:30 PM (iran time)
  [{ event: "app/send.daily.news" }, { cron: "0 13 * * *" }],
  async ({ step }) => {
    // ✅ Step #1: Get all users
    const users = await step.run("get-all-users", getAllUsersForNewsEmail);
    if (!users || users.length === 0) {
      return { success: false, message: "No users found for news email" };
    }

    // ✅ Step #2:  For each user, get watchlist symbols -> fetch news (fallback to general)
    const results = await step.run("fetch-user-news", async () => {
      const perUser: Array<{
        user: UserForNewsEmail;
        articles: MarketNewsArticle[];
      }> = [];
      for (const user of users as UserForNewsEmail[]) {
        try {
          const symbols = await getWatchlistSymbolsByEmail(user.email);
          let articles = await getNews(symbols);
          articles = (articles || []).slice(0, 6);
          if (!articles || articles.length === 0) {
            articles = await getNews();
            articles = (articles || []).slice(0, 6);
          }
          perUser.push({ user, articles });
        } catch (e) {
          console.error("daily-news: error preparing user news", user.email, e);
          perUser.push({ user, articles: [] });
        }
      }
      return perUser;
    });

    // ✅ Step #3: (placeholder) Format the news
    const userNewsSummaries = await step.run("format-news-html", async () => {
      const summaries: {
        user: UserForNewsEmail;
        newsContent: string | null;
      }[] = [];

      for (const { user, articles } of results) {
        if (!articles || articles.length === 0) {
          summaries.push({ user, newsContent: null });
          continue;
        }

        try {
          let htmlContent =
            '<h3 class="mobile-news-title dark-text" style="margin: 30px 0 15px 0; font-size: 18px; font-weight: 600; color: #f8f9fa; line-height: 1.3;">📊 Today\'s Top News</h3>';

          for (const article of articles) {
            htmlContent += `
              <div class="dark-info-box" style="background-color: #212328; padding: 24px; margin: 20px 0; border-radius: 8px;">
                
                <h4 class="dark-text" style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #FDD458; line-height: 1.4;">
                  ${article.headline || "News Headline"}
                </h4>

                <p class="mobile-text dark-text-secondary" style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">
                  ${article.summary || "No summary available."}
                </p>

                <div style="margin: 20px 0 0 0;">
                  <a href="${
                    article.url
                  }" style="color: #FDD458; text-decoration: none; font-weight: 500; font-size: 14px;" target="_blank" rel="noopener noreferrer">
                    Read Full Story →
                  </a>
                </div>
              </div>
            `;
          }

          summaries.push({ user, newsContent: htmlContent });
        } catch (e) {
          console.error("Failed to format news for: ", user.email, e);
          summaries.push({ user, newsContent: null });
        }
      }

      return summaries;
    });

    // ✅ Step #4: (placeholder) Send the emails
    await step.run("send-news-emails", async () => {
      const emailResults = await Promise.allSettled(
        userNewsSummaries.map(async ({ user, newsContent }) => {
          if (!newsContent) {
            return { email: user.email, status: "skipped" };
          }

          try {
            await sendNewsSummaryEmail({
              email: user.email,
              date: getFormattedTodayDate(),
              newsContent,
            });
            return { email: user.email, status: "sent" };
            //  eslint-disable-next-line
          } catch (error: any) {
            console.error(
              `Failed to send email to ${user.email}:`,
              error.message
            );
            throw new Error(`Failed for ${user.email}: ${error.message}`);
          }
        })
      );
      const failedEmails = emailResults.filter((r) => r.status === "rejected");
      if (failedEmails.length > 0) {
        console.error("--- Some emails failed to send ---", failedEmails);
        throw new Error(
          `Failed to send ${failedEmails.length} emails. Check logs.`
        );
      }

      return emailResults;
    });

    return {
      success: true,
      message: "Daily news summary emails sent successfully",
    };
  }
);
