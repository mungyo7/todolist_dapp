import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "프로필",
  description: "사용자 지갑 정보 페이지",
});

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
} 