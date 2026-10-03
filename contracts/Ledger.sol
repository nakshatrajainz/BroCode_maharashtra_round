// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// Public notebook of company stamps and picture lines.
contract Ledger {
    enum Category {
        Maker,
        Editor,
        Publisher
    }

    struct Company {
        string name;
        Category category;
        bool allowed;
        uint64 registeredAt;
    }

    struct Line {
        bytes32 parentId;
        address stamp;
        Category action;
        bytes32 exactFingerprint;
        bytes32 lookalikeFingerprint;
        bytes32 hiddenId;
        bytes32 sealedPrompt;
        uint64 writtenAt;
    }

    address public keeper;
    mapping(address => Company) private companyRecords;
    mapping(bytes32 => Line) private lineRecords;
    mapping(bytes32 => bool) public lineExists;

    event CompanyRegistered(address indexed stamp, string name, Category category);
    event CompanyAllowanceChanged(address indexed stamp, bool allowed);
    event LineWritten(bytes32 indexed lineId, address indexed stamp, bytes32 parentId);

    error NotKeeper();
    error UnknownStamp();
    error StampAlreadyUsed();
    error CompanyNotAllowed();
    error WrongCategory();
    error MakerCannotHaveParent();
    error ParentMissing();
    error BadSignature();
    error LineAlreadyWritten();

    constructor() {
        keeper = msg.sender;
    }

    function registerCompany(address stamp, string calldata name, Category category) external {
        if (msg.sender != keeper) revert NotKeeper();
        if (stamp == address(0) || companyRecords[stamp].registeredAt != 0) revert StampAlreadyUsed();
        companyRecords[stamp] = Company(name, category, true, uint64(block.timestamp));
        emit CompanyRegistered(stamp, name, category);
    }

    function setAllowed(address stamp, bool allowed) external {
        if (msg.sender != keeper) revert NotKeeper();
        if (companyRecords[stamp].registeredAt == 0) revert UnknownStamp();
        companyRecords[stamp].allowed = allowed;
        emit CompanyAllowanceChanged(stamp, allowed);
    }

    function company(address stamp) external view returns (Company memory) {
        return companyRecords[stamp];
    }

    function line(bytes32 lineId) external view returns (Line memory) {
        return lineRecords[lineId];
    }

    function writeLine(
        bytes32 lineId,
        bytes32 parentId,
        address stamp,
        Category action,
        bytes32 exactFingerprint,
        bytes32 lookalikeFingerprint,
        bytes32 hiddenId,
        bytes32 sealedPrompt,
        bytes calldata signature
    ) external {
        if (lineExists[lineId]) revert LineAlreadyWritten();

        Company memory record = companyRecords[stamp];
        if (record.registeredAt == 0 || !record.allowed) revert CompanyNotAllowed();
        if (record.category != action) revert WrongCategory();

        if (action == Category.Maker) {
            if (parentId != bytes32(0)) revert MakerCannotHaveParent();
        } else if (parentId == bytes32(0) || !lineExists[parentId]) {
            revert ParentMissing();
        }

        bytes32 payload = keccak256(
            abi.encode(
                block.chainid,
                address(this),
                lineId,
                parentId,
                stamp,
                action,
                exactFingerprint,
                lookalikeFingerprint,
                hiddenId,
                sealedPrompt
            )
        );
        if (_recover(keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", payload)), signature) != stamp) {
            revert BadSignature();
        }

        lineRecords[lineId] = Line(
            parentId,
            stamp,
            action,
            exactFingerprint,
            lookalikeFingerprint,
            hiddenId,
            sealedPrompt,
            uint64(block.timestamp)
        );
        lineExists[lineId] = true;
        emit LineWritten(lineId, stamp, parentId);
    }

    function _recover(bytes32 hash, bytes memory signature) private pure returns (address) {
        if (signature.length != 65) return address(0);
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }
        if (v < 27) v += 27;
        if (v != 27 && v != 28) return address(0);
        return ecrecover(hash, v, r, s);
    }
}
