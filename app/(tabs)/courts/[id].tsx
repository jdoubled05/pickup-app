import { Redirect, useLocalSearchParams } from "expo-router";

export default function CourtsDetailRedirect() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  if (!id) {
    return <Redirect href="/courts" />;
  }
  return <Redirect href={{ pathname: "/court/[id]", params: { id } }} />;
}
