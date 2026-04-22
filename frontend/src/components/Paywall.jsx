import { Link } from "react-router-dom";
export default function Paywall({ message }) {
  return (
    <div className="notice">
      <strong>Upgrade required.</strong>{" "}
      {message || "Free plan limit reached. "}
      <Link to="/pricing">See plans →</Link>
    </div>
  );
}
