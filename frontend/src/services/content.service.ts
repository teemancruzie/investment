import { apiRequest } from "./api";
import { uploadFile } from "./user.service";

export type Faq = {
  id?: string;
  _id?: string;
  question: string;
  answer: string;
  category?: string;
  isPublished: boolean;
  order?: number;
};

export type TeamMember = {
  id?: string;
  _id?: string;
  name: string;
  title: string;
  bio?: string;
  image?: string;
  linkedin?: string;
  isPublished: boolean;
  order?: number;
};

export type Testimonial = {
  id?: string;
  _id?: string;
  name: string;
  role?: string;
  company?: string;
  avatar?: string;
  quote: string;
  rating?: number;
  isPublished: boolean;
  order?: number;
};

type Resource = "faqs" | "team" | "testimonials";

function crud<T>(resource: Resource) {
  return {
    list(all = false) {
      return apiRequest<T[]>(`/content/${resource}${all ? "?all=true" : ""}`, { auth: all });
    },
    create(body: Partial<T>) {
      return apiRequest<T>(`/content/${resource}`, { method: "POST", body, auth: true });
    },
    update(id: string, body: Partial<T>) {
      return apiRequest<T>(`/content/${resource}/${id}`, { method: "PATCH", body, auth: true });
    },
    remove(id: string) {
      return apiRequest<null>(`/content/${resource}/${id}`, { method: "DELETE", auth: true });
    },
  };
}

export const contentService = {
  faqs: crud<Faq>("faqs"),
  team: crud<TeamMember>("team"),
  testimonials: crud<Testimonial>("testimonials"),
  uploadTeamPhoto(file: File) {
    return uploadFile("/uploads/team", file);
  },
};

export const contentKeys = {
  faqs: (all: boolean) => ["content", "faqs", all] as const,
  team: (all: boolean) => ["content", "team", all] as const,
  testimonials: (all: boolean) => ["content", "testimonials", all] as const,
};
