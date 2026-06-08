// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SkillChain
 * @dev Auditable Educational Certification Platform on Blockchain
 */
contract SkillChain {
    // Platform Administrator
    address public admin;

    struct Institution {
        string name;
        address wallet;
        bool active;
    }

    struct Certificate {
        uint256 id;
        string certificateHash; // IPFS metadata/PDF CID hash
        string studentHash;     // Encrypted identifier / SHA256 of student details
        address issuer;
        uint256 issuedAt;
        bool revoked;
    }

    // Mappings
    mapping(address => Institution) public institutions;
    mapping(uint256 => Certificate) public certificates;

    // Tracks if a certificate ID has already been used
    mapping(uint256 => bool) public certificateExists;

    // Events
    event InstitutionRegistered(address indexed wallet, string name);
    event InstitutionStatusChanged(address indexed wallet, bool active);
    event CertificateIssued(uint256 indexed id, string certificateHash, string studentHash, address indexed issuer);
    event CertificateRevoked(uint256 indexed id, address indexed revoker);

    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "SkillChain: Only administrator can perform this action");
        _;
    }

    modifier onlyActiveInstitution() {
        require(institutions[msg.sender].active, "SkillChain: Only active institutions can perform this action");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /**
     * @notice Registers a new educational institution or updates their status.
     * @param _wallet The wallet address of the institution.
     * @param _name The name of the educational institution.
     */
    function registerInstitution(address _wallet, string calldata _name) external onlyAdmin {
        require(_wallet != address(0), "SkillChain: Invalid institution wallet");
        require(bytes(_name).length > 0, "SkillChain: Name cannot be empty");

        institutions[_wallet] = Institution({
            name: _name,
            wallet: _wallet,
            active: true
        });

        emit InstitutionRegistered(_wallet, _name);
        emit InstitutionStatusChanged(_wallet, true);
    }

    /**
     * @notice Updates the active status of an institution (approve, suspend, or reactivate).
     * @param _wallet The wallet address of the institution.
     * @param _active True if active, false otherwise.
     */
    function setInstitutionStatus(address _wallet, bool _active) external onlyAdmin {
        require(institutions[_wallet].wallet != address(0), "SkillChain: Institution not registered");
        institutions[_wallet].active = _active;
        emit InstitutionStatusChanged(_wallet, _active);
    }

    /**
     * @notice Emits a new certificate on the blockchain.
     * @param _id Unique identifier for the certificate.
     * @param _certificateHash The IPFS CID/hash of the certificate metadata.
     * @param _studentHash The obfuscated identifier (e.g. SHA-256 hash) of the student.
     */
    function issueCertificate(
        uint256 _id,
        string calldata _certificateHash,
        string calldata _studentHash
    ) external onlyActiveInstitution {
        require(!certificateExists[_id], "SkillChain: Certificate ID already exists");
        require(bytes(_certificateHash).length > 0, "SkillChain: Certificate hash cannot be empty");
        require(bytes(_studentHash).length > 0, "SkillChain: Student identifier cannot be empty");

        certificates[_id] = Certificate({
            id: _id,
            certificateHash: _certificateHash,
            studentHash: _studentHash,
            issuer: msg.sender,
            issuedAt: block.timestamp,
            revoked: false
        });

        certificateExists[_id] = true;

        emit CertificateIssued(_id, _certificateHash, _studentHash, msg.sender);
    }

    /**
     * @notice Revokes a previously issued certificate.
     * @param _id Unique identifier of the certificate.
     */
    function revokeCertificate(uint256 _id) external {
        require(certificateExists[_id], "SkillChain: Certificate does not exist");
        Certificate storage cert = certificates[_id];
        require(!cert.revoked, "SkillChain: Certificate is already revoked");
        
        // Only the original issuer or the platform admin can revoke certificates
        require(
            msg.sender == cert.issuer || msg.sender == admin,
            "SkillChain: Not authorized to revoke this certificate"
        );

        cert.revoked = true;

        emit CertificateRevoked(_id, msg.sender);
    }

    /**
     * @notice Consults a certificate's registry status.
     * @param _id Unique identifier of the certificate.
     * @return isValid True if the certificate is active, not revoked, and the issuer is still active.
     * @return certificateHash The IPFS hash associated with the certificate.
     * @return studentHash The student identifying hash.
     * @return issuer The wallet address of the issuing institution.
     * @return issuedAt The timestamp of issuance.
     * @return revoked True if the certificate has been explicitly revoked.
     */
    function verifyCertificate(uint256 _id) external view returns (
        bool isValid,
        string memory certificateHash,
        string memory studentHash,
        address issuer,
        uint256 issuedAt,
        bool revoked
    ) {
        if (!certificateExists[_id]) {
            return (false, "", "", address(0), 0, false);
        }

        Certificate memory cert = certificates[_id];
        bool issuerActive = institutions[cert.issuer].active;
        bool valid = !cert.revoked && issuerActive;

        return (
            valid,
            cert.certificateHash,
            cert.studentHash,
            cert.issuer,
            cert.issuedAt,
            cert.revoked
        );
    }

    /**
     * @notice Checks if an address is an active registered institution.
     * @param _wallet Address to check.
     */
    function isInstitutionActive(address _wallet) external view returns (bool) {
        return institutions[_wallet].active;
    }

    /**
     * @notice Allows admin transfer.
     * @param _newAdmin Wallet address of the new administrator.
     */
    function transferAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "SkillChain: Invalid admin address");
        admin = _newAdmin;
    }
}
