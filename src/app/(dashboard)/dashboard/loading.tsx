import { BrandLoader } from "@/components/ui/spinner"

// The route-group loading.tsx only covers the first entry into the layout;
// navigations between sub-pages need a boundary in each segment like this one.
export default function DashboardHomeLoading() {
  return <BrandLoader />
}
