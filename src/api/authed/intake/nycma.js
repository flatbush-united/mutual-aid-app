const {
  createRequest,
  findRequestByExternalId
} = require("../../../airtable.js");

exports.nycmaIntakeHandler = async (req, res, next) => {
  if (!req.body.nycma) {
    return next(
      "Expected nycma data to be set on request body. This middlware should be used after body-parser."
    );
  }
  // TODO: need immediacy, cross streets and others are in the nycma form
  const { nycma } = req.body;

  const [existingRequest] = await findRequestByExternalId(nycma.id);
  if (existingRequest) {
    const err = new Error("Request with that external ID already exists");
    err.statusCode = 409;
    return next(err);
  }

  const requestMessage = [
    "This is a request from a different system.\n",
    "The type of support requested is:\n",
    nycma.supportType || "n/a",
    "\nIn a free-form request they said:\n",
    nycma.otherSupport || "nothing",
    "\nThey are in this hard-hit community:\n",
    nycma.community || "n/a"
  ];
  const nycmaRequest = {
    message: requestMessage.join(" "),
    phone: nycma.phone || "If there's no email too, please tell #tech!",
    externalId: nycma.id,
    email: nycma.email || "",
    urgency: nycma.urgency || "",
    crossStreets: nycma.crossStreet,
    source: "nycma"
  };
  const [record, e] = await createRequest(nycmaRequest);
  if (e) {
    const err = new Error("Couldn't create request in Airtable");
    err.statusCode = 500;
    return next(err);
  }

  console.log(`Created request: ${record.getId()}`);
  res.send(record.getId());
  return record.getId();
};
