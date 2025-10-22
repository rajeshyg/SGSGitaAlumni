**Gita Connect Application**

# **Objective**: 

Gita Connect Application provides a professional platform for all Gita Family members (i.e. Alumini’s) to connect on different services that each individual can support vs. seek support from other gita family members. Different services include and is not limited to:

1. Internship at a company  
2. Jobs   
3. accommodation request   
4. Study groups on different domains (i.e. medical, engineering, arts etc)  
5. Seeking additional information on specific domain for higher studies, research etc

# Workflows:

Gita Connect Application has different workflows in order to ensure quality service being rendered to users and utilization of services.

1. User Authentication workflow \- Login  
   1. Member  
   2. Moderator  
   3. Admin  
2. Member Workflow  
   1. Set Preferences  
   2. Browse Postings  
   3. Offer Help  
   4. Seek Help  
   5. Chat  
3. Moderator Workflow  
   1. Review postings and perform decision  
   2. Monitor Posting (i.e. Scam posting, Fake postings, multiple posting for same item, Expired posting)  
   3. Metrics & Reporting  
4. Admin Workflow  
   1. Assign Roles \- Assign Moderator, admins   
   2. Maintenance of application \- Upgrades  
   3. Backend Support

# Workflow Requirements:

## User Authentication workflow

1. Login Page must accept User ID and Password as mandatory fields.   
2. Login Page must include a Login Button and Forgot ID/Password Link  
3. User ID can be an email id or combination of alphabets and characters which is max of 10 bytes  
4. Password must allow a combination of Alphabets, Characters, Specialty Characters which can be in the range of 6-12 bytes long. Password characters must not be visible to the user. Password must follow the standard encryption rules when validated against the stored password  
5. When User Clicks Login Button, the User must be provided with the Home Page that is specific to the Role mapped to the user.   
6. Profile Selection: After clicking Login, the User is navigated to a Profile Selection page where they can confirm or select their active profile before accessing the role-specific Home Page.  
7. Menu options on the Home Page must be specific to the Role that the user is mapped to.  
8. Forgot ID/Password when clicked must be navigated to forgot ID/password page when user will be prompted to enter the User Id or an option to recover USer ID and submit generate new password only when a valid USer ID is provided  
9. Forgot ID/Password link when clicked on Login Page must be navigated to forgot ID/password page   
10. User will be prompted to enter the User Id.   
    1. If user enters a valid user id that it matches to the registered one then user will be prompted to reset password   
    2. If User forgot USerID then the user must enter the data below and then click recover password. User must be successfully validated against the User details provided and will trigger email to an registered email id providing a link to Reset Password  
       1. First Name as provided during registration  
       2. Last Name as provided during registration  
       3. Email as provided during registration  
       4. Phone number as provided during registration  
11. When a user clicks the reset password link, it should generate an email to the registered email id as a secure link.  
12. When USer clicks Reset PAssword in their personal email as a secure link, User must be navigated to Recover Password page with valid USer ID being displayed for the user  
13. Passwords must allow a combination of Alphabets, Characters, Specialty Characters which can be in the range of 6-12 bytes long. Password characters must not be visible to the user. Password must follow the standard encryption rules when validated against the stored password  
14. Each User that has change password must be recorded in the backend audit tracking table to ensure when password is changed and status is success or fail  
15. On successful completion of reset password, User will be navigated to home page based on the role being played   
16.   
17. Within the Gita Connect Application, there are three main Roles.   
1. Member  
2. Moderator  
3. Admin  
18. Each User can be assigned to any of these three roles. An User can be active on any one of these roles  
19. Role based access must be followed when user logs in to the application  
20. Users can be grouped under the same family tree. I.e if there are 3 members in the family then there can be one user credential (id/Pwd) and allows all 3 users to login to the same profile. This is allowed only for Member role login only. 

| Roles Grid (Sample) |  |  |  |  |  |  |  |
| ----- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| **Roles** | **Assign Role to User** | **Change Roles** | **Maintain Postings** | **New Posting Add** | **Approve/Reject Posting** | **Identify Scam / Duplicate Posting** | **Chat Option** |
| Member |  |  |  | Y |  |  | Y |
| Moderator |  |  | Y |  | Y | Y | Y |
| Admin | Y | Y | Y | Y | Y | Y | Y |

## Member Workflow

1. Members as a user when login must undergo an authentication process to ensure member role is successfully confirmed.   
2. After authentication, Members are directed to a Personalized Dashboard that displays content tailored to their preferences, selected domains, and previous interactions.  
3. When Member is logged in, member will have multiple options to perform and is not limited to:  
   1. **Preferences**  
      1. Member can select which domain the posting can be provided   
      2. Members can select up to 5 postings for seeking support. The number of posting must be made as configurable value and can be allowed to change to a higher or lower value.  
      3. When Member selects the maximum allowed posting, Member must be provided with a message “Limit of 5 selections is reached. Please modify or Confirm your election”   
      4. Domains or Labels provided to the member and is not limited to:  
         1. Healthcare  
            1. Medical  
               1. Internal Medicine  
               2. Gynaecology  
               3. Oncology  
               4. Neurology  
            2. Pharmacy  
               1. Benefit Manager  
               2. Pharmacist  
            3. Dental  
               1. Dental Surgeon  
               2. General Dentist  
            4. Behavioral  
               1. Psychiatric  
               2. Mental Health (ADHD etc)  
            5. Vision  
               1. Optometry  
               2. Optometrist  
         2. Engineering  
            1. Computer Science  
            2. Mechanical  
            3. Industrial  
            4. Aerospace  
            5. Civil  
            6. Electronics and Telecommunication  
         3. Arts & Crafts  
            1. Interior Designer  
            2. Artist  
         4. Music  
            1. Singer  
            2. Instruments player  
         5. Real Estate Housing  
            1. Agent  
            2.    
         6.   
      5. Member can switch between Offering Support vs. Seeking Support on any of the domains listed above  
      6. Member can provide information on their education or professional category i.e student / Professional   
      7. Based on points a, b & c, member selections must be captured and postings will be provided to the member   
   2. **Browse postings**  
      1. Members can browse postings with advanced filtering and searching capabilities, including:  
         1. Filtering by Category (e.g., Admissions, Scholarships, Internships, Medical Residencies, Research Opportunities)  
         2. Searching by Tags (e.g., Artificial Intelligence, Neurology, Pharmacology, Computer Science, Data Science)  
         3. Viewing Recommended postings based on their preferences and past interactions  
      2. Member can browse the postings that are filtered to the selections made on domain  
      3. For a Specific posting, if Member is interested and would like to obtain more details then member can express interest.   
         1. Once the Interested option is confirmed, Members will be provided with options to submit details to the respective posting.   
         2. Members can submit details to the relevant posting and wait for confirmation of receipt.  
         3. Post confirmation of receipt, Members will have the option to connect with the relevant posting owner to chat and get additional details.  
      4. Member postings will have an expiry date. Expiration of posting will be greater of date (the posting expiry date vs. 30 days from the day of posting submission)  
      5. Audit trail must be maintained to tracked to outline below items:  
         1. which member submitted interest for which posting   
         2. when the posting was expired  
         3. when the member had received confirmation   
         4. Whether the posting helped the member or not  
   3. **Offer Support**  
      1. Members can click the Offer support option on the home page.  
      2. When Offer support is clicked, member must be provided with form to input the posting details and what is the support offering  
         1. Name of the item:  
         2. Domain : domain as outlined in 2.a.iv above need to be provided to select the option. USer is allowed to select one option only for this posting  
         3. Description of the posting: this should be a text area to provide details of posting. This can allow up to 5000 characters.   
         4. Contact Name: name of the owner of this posting   
         5. Contact Phone No: Phone number of the owner of this posting. Based on the Country, phone number validation must be performed to accept the actual number of digits  
         6. Contact Email: Email ID of the owner of this posting. EMail must be validated to ensure its a legitimate email address  
         7. Submit and Cancel Actions:   
            1. Submit action is performed when all the above fields are entered. Validation must be performed to ensure the above fields are not left blank. Post successful Validation, data must be stored in database  
            2. Cancel ACtion: all the above items entered will be cleared and USer will be provided with a popup window to confirm “Are you sure you want to cancel ?” Yes / NO. IF yes then the user will cancel the form entry and navigate to the home page. If No, then USer will stay in the Offer Support Page    
         8. Members once successfully submitted, a notification must be generated to the moderator. This can be a notifications icon on the homepage for the moderator and provides a total number of notifications that need to be made.  
   4. **Seek Support**   
      1. This is as outlined in the Browse postings item above 2.b.ii till iv.  
      2. Members have an option to seek Support.   
      3. Member can submit a request for seeking support  
      4. When creating a help request, Members can:  
         1. \- Select a category for the help request  
         2. Add relevant tags to describe the request  
         3. Describe the problem in detail  
         4. Set an urgency level (e.g., Low, Medium, High)  
         5. Submit the request for moderator review  
      5. Members can manage their help requests, including:  
         1. Viewing responses from other members  
         2. Accepting help offers  
         3. Rating helpers based on the quality of support received  
      6. Member will follow same instructions as outlined in points 2.c.ii in submitting the details for seeking support  
           
   5. **Chat**  
      1. When provided with a Chat window, it will establish a secure connection with Member Offering Support and Member Seeking Support ONLY.   
      2. The Chat system supports multiple functionalities, including:  
         1. Direct Messaging for one-on-one communication  
         2. Group Discussions for collaborative conversations  
         3. Post-Linked Chats tied to specific help requests or postings  
      3. The chat system enables one-to-many communication, allowing members to engage with multiple individuals through separate, private chat sessions. Specifically:  
         1. A member seeking help (e.g., a student requesting assistance on a specific subject) can connect with multiple members offering help, with each connection occurring in its own private chat session.  
         2. A member offering help can connect with multiple members seeking help, with each connection facilitated through a distinct private chat session.  
         3. Each chat session is a secure, one-to-one conversation between the two parties, ensuring focused and confidential communication.  
      4. Chat data must follow standard encryption and decryption protocols to ensure there is data security  
      5. Chat window, if left idle for 5 mins, it should prompt an option “Do you wish to continue? Yes / NO”  
      6. Post completion of Chat, the details of the chat in encrypted format must be stored for security and audit purposes.   
      7. Chat Data must be retained for 1 year until it can be discarded. . 

## Moderator Workflow

1. **Review postings and perform decision**  
   1. Moderators will have the option to review all postings that have been submitted by a Member.   
   2. Moderator when clicks the notification icon, a drop down should pop out and provide highlights of few notifications (max 5\)  
   3. The posting that are submitted by Member, will be provided in a tabular grid for Moderator  
   4. Moderator can perform review of each posting can click on each notification   
   5. Moderator review process includes:  
      1. Verifying the appropriateness of the selected category  
      2. Verifying the appropriateness of assigned tags  
      3. Checking the quality and accuracy of the posting content  
      4. Making a moderation decision: Approve, Reject, or Request Changes  
   6. When Requesting Changes, Moderators will specify the changes needed and notify the member for resubmission.  
   7. Moderator can view the content of the posting and confirm the decision: Approve or Reject  
      1. Once Approved,   
         1. If the posting is for Offer Support then it will made available for members who had opted in for the domain category and allow members to select for Seek Support  
         2. If the posting is for seeking support then it will be made available for the entire group  
      2. When Rejected,  
         1. Moderators will provide feedback on the additional details that are required to make sure the data is complete or accurate. This is consistent for both offer and seek support.

      

2. **Monitor Posting (i.e. Scam posting, Fake postings, multiple posting for same item, Expired posting)**  
   1. Moderator must monitor posts on regular cadence to ensure there is data security and data safety  
   2. Moderators must be provided with analytics on identifying scam posts.  
      1. This can be through running background checks on regular basis to ensure the postings are genuine  
      2. IF any of the postings where the user is modified or duplicate users or duplicate postings with details inaccurate then those postings will need to be provided for moderator review  
   3. Moderator must have the option to identify Spam and block those postings and the relevant credentials to avoid from occurring again   
      

        
3. **Metrics & Reporting**  
   1. Moderator must be provided to generate metrics for the postings  
   2. Metrics must include and is not limited to:  
      1. Which category of postings had more response  
         1. Of those responses, how many were able to get support  
         2. Of the responses, how many were able to offer support  
      2. Which category of posting(s) had less responses  
      3. Which category of posting(s) is combined and need more classification  
   3. Moderator must generate standard operational reports like  
      1. Total posting by category in a time period (i.e. week, month year)  
      2. Total posting by Offer support and seek support and by category

 


## Admin Workflow

Admin is another Role that will be assigned to the specific user in order to support maintenance of the application and other functionalities like Assigning role. 

Admin must have the option to assign roles to other registered users. This is primarily to assign moderator by different Regions / centers across the country

Analytics:  
Admins have access to an Analytics Dashboard that provides insights, including:  
\- User Activity metrics (e.g., login frequency, posting activity)  
\- Popular Categories (e.g., most active domains or categories)  
\- Success Metrics (e.g., successful help request resolutions)  
\- Help Request Statistics (e.g., number of requests, response rates)

# Reference Links:

[https://www.mermaidchart.com/raw/53b08dad-db27-4393-bde1-75fac09abc3f?theme=light\&version=v0.1\&format=svg](https://www.mermaidchart.com/raw/53b08dad-db27-4393-bde1-75fac09abc3f?theme=light&version=v0.1&format=svg)

[https://www.mermaidchart.com/raw/fb20d82b-e196-476d-83d3-44f325359642?theme=light\&version=v0.1\&format=svg](https://www.mermaidchart.com/raw/fb20d82b-e196-476d-83d3-44f325359642?theme=light&version=v0.1&format=svg)

[https://sgsgitaalumni-git-feature-chat-dattarajeshs-projects.vercel.app/admin](https://sgsgitaalumni-git-feature-chat-dattarajeshs-projects.vercel.app/admin)

datta.rajesh@gmail.com  
admin

sankarijv@gmail.com  
moderator

kishoredola9@gmail.com  
student

Pwd test

