import { Link } from "react-router-dom";
export default function NotFound() {
  return (
    <div className="container center" style={{paddingTop:80}}>
      <h1>404</h1>
      <p className="muted">That page does not exist.</p>
      <Link to="/" className="btn">Back home</Link>
    </div>
  );
}
