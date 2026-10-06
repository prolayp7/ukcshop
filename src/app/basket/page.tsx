import BasketPage from "@/components/pages/BasketPage";
import { parts } from "@/designs/highstreet";

export const dynamic = "force-dynamic";

export default function Page() {
  return <BasketPage parts={parts} />;
}
