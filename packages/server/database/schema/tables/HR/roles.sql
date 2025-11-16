CREATE TABLE Roles (
    Description VARCHAR(255) NOT NULL,
    ClearanceLevel INT NOT NULL
);
INSERT INTO Roles (Description, ClearanceLevel) VALUES ('Owner', 0);
INSERT INTO Roles (Description, ClearanceLevel) VALUES ('Manager', 1);
INSERT INTO Roles (Description, ClearanceLevel) VALUES ('HR', 2);
INSERT INTO Roles (Description, ClearanceLevel) VALUES ('Associate', 3);
