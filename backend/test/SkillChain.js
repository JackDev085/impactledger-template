import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;

describe("SkillChain Contract", function () {
  let SkillChain;
  let skillChain;
  let admin;
  let institution;
  let student;
  let stranger;

  beforeEach(async function () {
    [admin, institution, student, stranger] = await ethers.getSigners();
    SkillChain = await ethers.getContractFactory("SkillChain");
    skillChain = await SkillChain.deploy();
  });

  describe("Deployment", function () {
    it("Should set the right admin", async function () {
      expect(await skillChain.admin()).to.equal(admin.address);
    });
  });

  describe("Institution Registration", function () {
    it("Should allow admin to register an institution", async function () {
      await expect(skillChain.connect(admin).registerInstitution(institution.address, "Universidade Federal"))
        .to.emit(skillChain, "InstitutionRegistered")
        .withArgs(institution.address, "Universidade Federal");

      const inst = await skillChain.institutions(institution.address);
      expect(inst.name).to.equal("Universidade Federal");
      expect(inst.wallet).to.equal(institution.address);
      expect(inst.active).to.equal(true);
    });

    it("Should prevent non-admin from registering institutions", async function () {
      await expect(
        skillChain.connect(stranger).registerInstitution(stranger.address, "Fake School")
      ).to.be.revertedWith("SkillChain: Only administrator can perform this action");
    });

    it("Should allow admin to deactivate/reactivate institutions", async function () {
      await skillChain.connect(admin).registerInstitution(institution.address, "Universidade Federal");
      
      // Deactivate
      await expect(skillChain.connect(admin).setInstitutionStatus(institution.address, false))
        .to.emit(skillChain, "InstitutionStatusChanged")
        .withArgs(institution.address, false);

      expect(await skillChain.isInstitutionActive(institution.address)).to.equal(false);

      // Reactivate
      await expect(skillChain.connect(admin).setInstitutionStatus(institution.address, true))
        .to.emit(skillChain, "InstitutionStatusChanged")
        .withArgs(institution.address, true);

      expect(await skillChain.isInstitutionActive(institution.address)).to.equal(true);
    });
  });

  describe("Certificate Issuance", function () {
    const certId = 101;
    const certHash = "QmXoypizjW3WknFixtdKL9bL72Fpd99F6gVKwg36zp6g4u";
    const studentHash = "student-sha256-hash-representation";

    beforeEach(async function () {
      await skillChain.connect(admin).registerInstitution(institution.address, "Universidade Federal");
    });

    it("Should allow active institutions to issue certificates", async function () {
      await expect(
        skillChain.connect(institution).issueCertificate(certId, certHash, studentHash)
      )
        .to.emit(skillChain, "CertificateIssued")
        .withArgs(certId, certHash, studentHash, institution.address);

      const [isValid, hash, sHash, issuer, issuedAt, revoked] = await skillChain.verifyCertificate(certId);
      expect(isValid).to.equal(true);
      expect(hash).to.equal(certHash);
      expect(sHash).to.equal(studentHash);
      expect(issuer).to.equal(institution.address);
      expect(revoked).to.equal(false);
    });

    it("Should reject duplicate certificate IDs", async function () {
      await skillChain.connect(institution).issueCertificate(certId, certHash, studentHash);
      
      await expect(
        skillChain.connect(institution).issueCertificate(certId, "another-hash", studentHash)
      ).to.be.revertedWith("SkillChain: Certificate ID already exists");
    });

    it("Should prevent inactive institutions from issuing certificates", async function () {
      await skillChain.connect(admin).setInstitutionStatus(institution.address, false);

      await expect(
        skillChain.connect(institution).issueCertificate(certId, certHash, studentHash)
      ).to.be.revertedWith("SkillChain: Only active institutions can perform this action");
    });
  });

  describe("Certificate Revocation", function () {
    const certId = 202;
    const certHash = "QmYwAPz98kkpE15xtmLxbMWb72Fpd69F6gVKwg36zp6g4w";
    const studentHash = "another-student-hash";

    beforeEach(async function () {
      await skillChain.connect(admin).registerInstitution(institution.address, "Universidade Federal");
      await skillChain.connect(institution).issueCertificate(certId, certHash, studentHash);
    });

    it("Should allow issuer to revoke their own certificate", async function () {
      await expect(skillChain.connect(institution).revokeCertificate(certId))
        .to.emit(skillChain, "CertificateRevoked")
        .withArgs(certId, institution.address);

      const [isValid, , , , , revoked] = await skillChain.verifyCertificate(certId);
      expect(isValid).to.equal(false); // Should be invalid now
      expect(revoked).to.equal(true);
    });

    it("Should allow admin to revoke certificates", async function () {
      await expect(skillChain.connect(admin).revokeCertificate(certId))
        .to.emit(skillChain, "CertificateRevoked")
        .withArgs(certId, admin.address);

      const [isValid] = await skillChain.verifyCertificate(certId);
      expect(isValid).to.equal(false);
    });

    it("Should prevent strangers from revoking certificates", async function () {
      await expect(
        skillChain.connect(stranger).revokeCertificate(certId)
      ).to.be.revertedWith("SkillChain: Not authorized to revoke this certificate");
    });
  });
});
