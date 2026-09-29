import RegisterPage from "@/designs/highstreet/RegisterPage";
import { fetchRegisterPageContent } from "@/lib/api";

export default async function Page() {
  return <RegisterPage content={await fetchRegisterPageContent()} />;
}
