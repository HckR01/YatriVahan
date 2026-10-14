import { Link, useParams } from "react-router-dom";
import Page, { Empty } from "../../components/ui/Page";
export default function RideChatPage() {
  const { rideId } = useParams();
  return (
    <Page
      title="Ride chat"
      description="Stay in touch with your fellow travellers."
    >
      <Empty title="Ride chat is not available yet">
        Messaging for rides hasn’t been enabled. No message has been sent.
      </Empty>
      <Link className="button secondary" to={`/rides/${rideId}`}>
        Back to ride
      </Link>
    </Page>
  );
}
