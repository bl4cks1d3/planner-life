import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { GoogleAuthService } from "./google-auth.service";

const CALENDAR_LIST_API = "https://www.googleapis.com/calendar/v3/users/me/calendarList";
const CALENDAR_EVENTS_API = "https://www.googleapis.com/calendar/v3/calendars";

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  location?: string;
  account: string;
  calendarName: string;
}

interface GCalListResponse {
  items?: { id: string; summary?: string; selected?: boolean; deleted?: boolean }[];
}

interface GCalEventsResponse {
  items?: {
    id: string;
    summary?: string;
    location?: string;
    start?: { dateTime?: string; date?: string };
    end?: { dateTime?: string; date?: string };
  }[];
}

@Injectable()
export class CalendarService {
  constructor(private readonly googleAuth: GoogleAuthService) {}

  private async googleFetch(url: string, email: string) {
    const accessToken = await this.googleAuth.getValidAccessToken(email);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) {
      throw new InternalServerErrorException(`Calendar API respondeu ${res.status}: ${await res.text()}`);
    }
    return res.json();
  }

  /**
   * Todas as agendas visiveis na conta (a propria + secundarias + as
   * compartilhadas que o usuario ja tem habilitadas no Google Calendar --
   * e assim que a agenda da familia, por exemplo, aparece aqui tambem).
   */
  private async listCalendars(email: string): Promise<{ id: string; name: string }[]> {
    const data = (await this.googleFetch(CALENDAR_LIST_API, email)) as GCalListResponse;
    return (data.items ?? [])
      .filter((c) => !c.deleted && c.selected !== false)
      .map((c) => ({ id: c.id, name: c.summary ?? c.id }));
  }

  private async listEventsFromCalendar(
    email: string,
    calendarId: string,
    calendarName: string,
    maxResults: number
  ): Promise<CalendarEvent[]> {
    const params = new URLSearchParams({
      timeMin: new Date().toISOString(),
      maxResults: String(maxResults),
      singleEvents: "true",
      orderBy: "startTime",
    });
    const url = `${CALENDAR_EVENTS_API}/${encodeURIComponent(calendarId)}/events?${params.toString()}`;
    const data = (await this.googleFetch(url, email).catch(() => ({ items: [] }))) as GCalEventsResponse;
    return (data.items ?? []).map((item) => ({
      id: `${calendarId}:${item.id}`,
      title: item.summary ?? "(sem titulo)",
      start: item.start?.dateTime ?? item.start?.date ?? new Date().toISOString(),
      end: item.end?.dateTime ?? item.end?.date,
      location: item.location,
      account: email,
      calendarName,
    }));
  }

  private async listForAccount(email: string, maxResults: number): Promise<CalendarEvent[]> {
    const calendars = await this.listCalendars(email);
    const perCalendar = await Promise.all(
      calendars.map((cal) => this.listEventsFromCalendar(email, cal.id, cal.name, maxResults))
    );
    return perCalendar.flat();
  }

  async listUpcoming(maxResults = 10): Promise<CalendarEvent[]> {
    const accounts = this.googleAuth.listAccounts().map((a) => a.email);
    const perAccount = await Promise.all(
      accounts.map((email) => this.listForAccount(email, maxResults).catch(() => []))
    );
    return perAccount
      .flat()
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, maxResults);
  }
}
