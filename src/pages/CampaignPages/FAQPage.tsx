import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface FAQItem {
    id: string;
    question: string;
    answer: string;
}

const faqData: FAQItem[] = [
    {
        id: 'recitals',
        question: 'What are the recitals of this agreement?',
        answer: `RECITALS:

1. The Owner is the legal, registered and/or beneficial proprietor of the property, meticulously described in Item 7 of First Schedule ("Property").

2. The Company, distinguished as a comprehensive entity, provides co-living accommodation to end-users while administering property management services to property owners. In addition to its operational, technological and marketing strengths, the Company also possesses deep expertise in designing and renovating residential properties specifically optimised for co-living use and long-term rental yield (ROI). Through its proprietary systems and tested design strategies, the Company delivers end-to-end solutions that transform vacant units into profitable rental assets, thereby contributing to a sustainable urban housing strategy.

3. This Owner Collaboration Agreement hereby outlines a Rental Investment Strategy whereby the Company and the Owner, unified in purpose, embark on a collaborative endeavour aimed at achieving optimal rental yield, managing property-related operations and steering ongoing room rental sales and marketing initiatives (hereinafter referred to as the "Rental Investment Strategy"). All matters pertaining thereto shall be subject to the terms and conditions contained in this Agreement.

4. By virtue of this Agreement, the Owner unequivocally grants the Company full right, power, and authority to:
i. execute comprehensive renovation works on the Property, including all interior improvements as specified in the agreed quotation entered into between the Parties; and
ii. serve as the Owner's exclusive operational partner in promoting, managing, and entering into tenancy arrangements with tenants, and to carry out all necessary actions to ensure the Property is fit and suitable for co-living purposes as intended herein.`
    },
    {
        id: 'general',
        question: 'What are the general terms and conditions?',
        answer: `1.1 Parties acknowledge, confirm and agree that any and all Schedules and Policies enclosed in this Agreement or incorporated by reference shall be treated as the essential part of the Agreement and shall constitute a full and binding legal agreement between the Parties.

1.2 The Parties acknowledge and confirm that the Parties hereto have read and agreed to all the terms and conditions contained in this Agreement.

1.3 Any reference in this Agreement to any statute or statutory provision order or regulation shall be construed as including a reference to that statute or statutory provision order or regulation as from time to time amended, modified, extended or re-enacted whether before or after the date of this Agreement and to all statutory instruments orders regulations and directives modifying or extending the same.

1.4 Unless the context otherwise requires words denoting the singular shall include the plural and vice versa and words denoting any one gender shall include all genders.

1.5 Unless otherwise stated time shall be of the essence for the purpose of the performance of the Parties' obligations pursuant to this Agreement.`
    },
    {
        id: 'duration',
        question: 'What is the duration and term of this agreement?',
        answer: `2.1 Term: The collaborative engagement between the Company and the Owner shall be a period described in Item 4 of the First Schedule ("Term"), with automatic renewal for successive two-year periods upon the expiration thereof.

2.2 Commencement Date: This Agreement shall come into effect from the date described in Item 1 and 2 of the First Schedule (whichever later), or such other date as may be mutually agreed upon in writing by the Parties provided always that the first down payment has been received and the keys have been duly delivered by the Purchaser to the Company.`
    },
    {
        id: 'renovation',
        question: 'What are the renovation, furnishing & delivery works terms?',
        answer: `3.1 Owner Engagement & Renovation Payment Terms

(a) The Company hereby accepts the Owner's engagement to carry out, execute, and complete the upgrading, furnishing, and alteration works to the Property, based on the detailed scope and specifications as set out in the official quotation at RenoXpert System. The Owner agrees to pay the Company the amounts stated therein.

(b) All payments shall be made strictly in accordance with the payment schedule, breakdown, and terms outlined in the quotation, either via the Company's designated payment gateway or such payment method as may be officially notified in writing by the Company.

(c) All payments made by the Owner to the Company shall be deemed fully earned and strictly non-refundable, as they correspond to work already completed, materials procured, or services rendered by the Company prior to any termination of this Agreement, regardless of the cause.

(d) Any variation to the total contract sum, scope of renovation works, materials, furnishings, or the project timeline — whether initiated by the Owner or the Company — must be expressly documented, mutually agreed upon in writing, and signed by both Parties. Verbal instructions or implied modifications shall not be valid or binding under any circumstances.

3.2 Commencement of the Company's Renovation Work

3.2.1 The Company shall commence renovation works (including wiring, painting, and smart device installation) only after the following conditions have been fully satisfied:
(a) The Owner has made the first down payment as set out in the quotation issued at the RenoXpert System.
(b) Visible defects in the Property have been rectified either by the Developer or by the Owner's appointed workers to the satisfaction of the Company.
(c) The necessary renovation permits or approvals from the building management or relevant authorities have been obtained (by either the Owner or the Company, whichever applicable).
(d) A full set of keys and access cards for the Property has been handed over to the Company.

Upon full satisfaction of all the above conditions (3.2.1(a) to (d)), the renovation works shall commence within seven (7) working days. If any of the above conditions are delayed or not met, the Owner agrees that the Company shall be entitled to postpone the renovation start and completion date without liability for late delivery or liquidated damages.

3.2.2 Payment & Work Suspension Rights

The Owner shall make all renovation payments strictly in accordance with the schedule, amount, and milestones outlined in the quotation.

In the event of any delay, withholding, or non-payment of any part of the agreed sum, the Company reserves the full right to:
• immediately suspend all ongoing works without penalty;
• extend the project timeline accordingly without any liability for delay;
• impose late payment interest and/or claim for any losses, damages, or costs incurred due to the Owner's breach of payment obligations;
• withhold any delivery of keys, fittings, or documentation until all outstanding sums are settled in full.

For the avoidance of doubt, the renovation duration, milestones, and completion date shall be governed solely by the quotation mutually agreed by both Parties and do not form part of this main body of Agreement.

3.3 Renovation Completion & Property Handover

3.3.1 The Company shall notify the Owner upon substantial completion of the renovation works and invite the Owner for an on-site inspection and handover.

3.3.2 Upon completion, a Renovation Handover Form shall be issued, detailing the scope completed, condition of the unit, and any remaining items (if any). The Owner shall sign and return the Handover Form within three (3) working days of receipt or shall be deemed to have accepted the condition of the Property.

3.3.3 The Company shall not be held liable for any delay in handover due to the Owner's failure to attend inspection or respond to the Handover Form within the specified period.

3.3.4 Once the handover is completed, the Owner shall not unreasonably delay or withhold the commencement of co-living operations.

3.4 Warranty and Defect Period

3.4.1 The Company warrants that each product supplied, installed, or provided under this Agreement ("Product") shall conform to its stated specifications during the applicable warranty and defect period. Should any Product fail to meet its specifications due to the Company's fault, the Owner shall be entitled to submit a written claim under this Product Warranty. All claims must be made in writing and served to the Company.

3.4.2 The duration of the Product Warranty varies by item, ranging from six (6) to twelve (12) months, depending on the type of Product supplied.

3.4.3 The Product Warranty period shall commence from the date of installation of the respective Product and shall expire upon completion of the applicable duration as stated. For the Company to process any claim, the Owner may be required to furnish this Agreement together with the original sales receipt or invoice as proof of purchase.

3.4.4 The Product Warranty shall be void and shall not apply in the following circumstances:
i. Damages or defects resulting from negligence, misuse, abuse, tampering, or improper maintenance by the Owner, any end-user, or third party;
ii. Malfunctions or damage caused by external factors, including but not limited to accidents, fire, lightning, floods, acts of God, theft, burglary, or exposure to water or moisture;
iii. Any damage or defect caused by the Owner, tenants, contractors, or third parties, whether accidental or intentional.

3.4.5 For the avoidance of doubt, the Company shall not be held liable for any malfunction, defect, integration issue, or delay arising from products, materials, or installations not supplied or performed by the Company. Any such items shall be solely under the responsibility and risk of the Owner, including any coordination with third-party contractors or suppliers engaged independently by the Owner.`
    },
    {
        id: 'co-living-management',
        question: 'What are the co-living management engagement & operational authority terms?',
        answer: `4.1 Appointment of Company as Co-Living Operator

Upon completion of the renovation and handover of the Property, the Owner hereby irrevocably appoints the Company as the exclusive co-living operator and property manager for the Property throughout the Term of this Agreement.

The Company shall have the full right and authority to:
• market, list, and promote the rooms or units within the Property through any platforms or channels it deems fit;
• enter into tenancy agreements with prospective tenants on behalf of the Owner;
• collect and manage rental income, deposits, and any other related payments;
• manage the day-to-day operations, maintenance, tenant issues, and necessary compliance for the Property;
• act in all capacities necessary to ensure optimal performance and tenant satisfaction within the Property;
provided always that all such actions are in alignment with the Rental Investment Strategy stated herein and in good faith to protect the Owner's long-term rental interests.

4.2 Use of Proprietary Management System

The Company possesses, operates and meticulously maintains its proprietary rental management system, hereinafter referred to as the "System." This System is instrumental in efficiently managing tenants' requests, overseeing rental and deposit collection, facilitating e-signing of documents, and other related tasks. The Company retains the prerogative to adopt, supplement, upgrade or replace the System with any other system deemed suitable and appropriate, at its sole discretion.

4.3 Access to Property and Credentials

The Company's access to the login credentials of the system and/or applications, alongside the keys and access cards (if applicable) to the Property, is granted upon the Owner's execution of this Agreement. The Company retains the prerogative to duplicate said credentials or keys should the need arise, at its sole discretion.

4.4 Daily Operational Duties

The Company assumes responsibility for the comprehensive management of all daily tasks, inclusive of fostering positive customer relations, executing cleaning or housekeeping duties, conducting maintenance activities, and meticulously handling rental and deposit collections.

4.5 Sales and Marketing Duties

The Company is tasked with ensuring that all sales and marketing activities are executed with utmost diligence, as deemed fitting and appropriate by the Company, to optimize rental income and occupancy levels.

4.6 Collection and Remittance

The Company shall administer all rental and non-rental related collections diligently and shall remit the Owner's share to the designated bank account as stated in Item 8 of the First Schedule by the 15th day of the subsequent calendar month. For compliance and security purposes, the Company shall only remit payments to the Purchaser's personal bank account provided by the Purchaser; third-party or proxy accounts are strictly not allowed.

4.7 Vacancy Management

The Company agrees to use its best effort to diligently fill vacancies within the Property by employing proactive marketing strategies as presented to the Owner by the Company.

4.8 Proactive Issue Reporting

It is the responsibility of the Company to proactively identify and promptly address any emerging issues and concerns to the Owner that may impact the performance or integrity of the Rental Investment Strategy.`
    },
    {
        id: 'owner-responsibilities',
        question: "What are the owner's responsibilities and covenants?",
        answer: `5.1 Property in Good and Habitable Condition

The Owner is obligated to guarantee that the Property is in a suitable state for occupancy and is handed over to the Company in a clean and habitable condition. This includes ensuring structural issues are well taken care of, such as, lifts, internal plumbing, fire-related, inter-flooring leakages, ceilings, flooring, etc.

5.2 Settlement of Outgoings for the Subject Property

It is the responsibility of the Owner to ensure that all outstanding payments, including quit rent, assessments, sewerage charges, maintenance fees, licensing fees, fire insurance premiums and any other applicable charges are settled promptly and free of arrears. The Owner hereby undertakes to provide or cause to provide the Company all the relevant utilities account details maintained with the respective service providers, Access Card Details registered with the Management and any other relevant details/information pertaining to the Property where such information shall be clearly detailed in Item 9, 10, 11 & 12 of the First Schedule.

The Owner shall ensure that the Company is duly added and registered in any building management application or system relating to the Property, whether as a family member, main tenant, authorised occupant, or such other status as may be permitted by the building management, and/or shall provide the Company with full access to such application or system, in a manner similar to the access arrangement set out in Item 10 of the First Schedule.

Should the Owner be unable to provide the details requires under Item 9, 10 and 11 of the First Schedule at the time of execution of this Agreement, the Owner shall be permitted to furnish such details to the Company subsequently by email or in writing, upon confirmation of the said details.

5.3 Property Setup to Company Standard

The Owner is required to ensure that the Property is set up or renovated in accordance with the Company's prevailing design specifications, quality standards, and operational requirements. The Company reserves the right to update these specifications from time to time to ensure compatibility with its management system and tenant preferences. If the Owner chooses to renovate or furnish the Property independently without using the Company's renovation service, the Owner must strictly adhere to the specifications, layout plans, and design standards provided by the Company prior to onboarding. Any material deviation from the approved specifications may result in the Company declining to onboard the Property under its CoLiving management program.

5.4 No Engagement of External Party

The Owner must refrain from engaging external agents, operators or any third parties to sell or rent out any rooms within the Property.

5.5 Notification by Owner

The Owner shall promptly notify the Company of any issues or concerns regarding the Property, including but not limited to, maintenance requirements, safety hazards or tenant complaints to ensure prompt resolution and smooth operations.

5.6 Change of Ownership

In the event of any changes to the ownership or legal status of the Property, this Agreement shall be deemed automatically terminated upon completion of the ownership transfer. The Owner shall provide the Company with a minimum of three (3) months' written notice prior to such change. The new owner shall not inherit the benefits or obligations of this Agreement and must enter into a separate agreement with the Company if they wish to continue the collaboration.

5.7 Consent to Access of Property Granted to Company

The Owner agrees to provide access to the Property to authorize representatives of the Company for inspection, maintenance or other necessary purposes, upon reasonable notice and during reasonable hours.

5.8 Disclaimer on Investment Forecasts and Estimates

The Owner acknowledges and agrees that any rental projections, cash flow simulations, occupancy forecasts, or return-on-investment estimates provided by the Company under its Rental Investment Strategy are strictly for illustrative and informational purposes only. These projections are based on prevailing market conditions, historical trends, and internal assumptions at the time of presentation, and shall not in any manner be construed as a representation, promise, warranty, or guarantee of actual future performance.

The Company shall not be held liable for any variance between the projected and actual performance of the Property, and the Owner is encouraged to conduct their own due diligence or seek independent financial advice before making any investment decisions.

5.9 Efforts to Maximize Rental Investment Outcomes

The Owner acknowledges that the Company will apply reasonable care, expertise, and commercially prudent practices under its Rental Investment Strategy to optimize the rental performance of the Property. While the Company endeavors to maximize occupancy and returns in line with prevailing market conditions, it does not warrant or guarantee any specific rental income, financial outcome, or investment return. All efforts are made in good faith, but actual results may vary based on external market forces and other factors beyond the Company's control.

5.10 Access Card and Keys of Property to Company

The Owner agrees and undertakes to pass all the access cards in the maximum quantity allowed by the Property Management Office together with keys of the Property to the Company during delivery of vacant possession of the Property or any earlier date as agreed by the parties herein. Should there be any replacement of access card required/ requested by the Company, the Owner shall do or cause to do the necessary for such replacement where the replacement fees and administrative charges (if any) shall be borne by the Company.

5.11 No Defamatory Statement by Property Owner

5.11.1 The Owner agrees not to make, publish, or cause to be made or published any false, disparaging, or defamatory statements—whether written, verbal, or online—about the Company, its directors, employees, subcontractors, services, or reputation. This includes statements made to third parties, on social media, review platforms, or in any public or private setting.

5.11.2 The Owner acknowledges that any such statements may cause significant harm to the Company's business and reputation, and that a breach of this clause may result in termination of this Agreement and in legal action, including claims for damages, legal costs, and injunctive relief. This obligation shall survive the termination or completion of this Agreement.

5.12 Respectful Conduct Towards the Company's Personnel

5.12.1 The Owner, and any person acting on the Owner's behalf, agrees to treat all employees, subcontractors, and representatives of the Company with respect and professionalism at all times. The Owner shall not engage in, or permit, any form of harassment, abusive behaviour, intimidation, or the use of explicit, offensive, or foul language toward the Company's personnel.

5.12.2 Any such behaviour may be considered a material breach under this Agreement, and the Company reserves the right to suspend work or terminate the Agreement immediately without liability in the event of occurrence of such conduct. The Company also reserves the right to seek legal remedies where appropriate, if required.

5.13 Payment of Maintenance Fee, Sinking Fund and Other Outgoings

5.13.1 The Owner hereby undertakes to pay all applicable maintenance fees related to the Property, including, but not limited to, fees for common area maintenance, repairs, and any other charges levied by the management authority or homeowners' association. All such fees shall be paid promptly in accordance with the schedule and terms established by the managing entity.

5.13.2 The Owner shall not intentionally delay or withhold payment of maintenance charges or any other applicable fees as a means to disrupt, interfere with, or sabotage the Company/Tenant's access to the Property or related facilities. Any such act of bad faith, including deliberate non-payment intended to cause operational inconvenience or pressure, shall constitute a material breach of this Agreement. In such cases, the Company reserves the right to take immediate corrective measures, including deactivation of access cards, imposition of penalties amounting to not less than twenty percent (20%) of the outstanding amount, and legal recovery of all dues and damages resulting from such conduct.

5.14 Anti-Sabotage and Payment Misconduct Clause

The Owner shall not engage in any act intended to delay, withhold, dispute, or reverse payment to the Company in bad faith, including but not limited to false claims, unjustified termination, or attempts to sabotage the Company's right to fair compensation for work duly performed. In the event of such conduct, the Company reserves the right to seek full legal recourse, including recovery of all outstanding amounts, interest, legal costs, and damages arising from such actions.

5.15 Non-Interference Clause

The Owner shall not interfere, directly or indirectly, with the Company's management, operations, tenant communications, pricing strategies and marketing activities once the Property has been handed over, except where expressly permitted under this Agreement.

Any interference by the Owner which results in tenant dissatisfaction, early termination, vacancy, or loss of income shall be deemed a material breach, and the Company shall not be liable for any resulting loss.

5.16 Indemnity by Owner

The Owner shall indemnify the Company, its directors, officers, employees, agents and contractors against all claims, losses, damages, liabilities, penalties, costs and expenses (including legal fees on a solicitor-and-client basis) arising from or in connection with:
(a) any breach of this Agreement by the Owner;
(b) any defect, non-compliance, or unsafe condition of the Property not caused by the Company;
(c) any claim by any authority, management body, or third party relating to licensing, building by-laws, or statutory compliance of the Property.

5.17 Regulatory and Statutory Compliance

The Owner acknowledges that compliance with local authority requirements, building by-laws, strata rules and usage approvals remains the Owner's sole responsibility.

The Company shall not be liable for any enforcement action, penalty, closure, fine, or restriction imposed by any authority arising from non-compliance attributable to the Property, its design, permitted use, or ownership status.`
    },
    {
        id: 'owner-representations',
        question: 'What are the owner representations and warranties?',
        answer: `6.1 The Owner hereby represents, warrants and undertakes to the Company that:-

(a) the Owner is the sole beneficial owner of the Property;

(b) the Owner has not and will not entered/enter into any agreement with any person, firm or company to lease the Property or any part thereof or granted any, option, licence, easement or any other right whatsoever over or in respect of the Property or any part thereof to any person, firm or company;

(c) the Owner has not been wound-up/adjudicated a bankrupt and no winding-up/bankruptcy proceedings have been instituted against the Owner and the Owner has the power and capacity to execute, deliver and perform the terms of this Agreement;

(d) the Owner has not carried out any renovation or alteration of whatsoever nature to the Property for which they have not obtained approvals from all the relevant authorities or parties;

(e) the Owner is able and capable legally and validly of entering into this Agreement and has full power and authority to execute, deliver and perform the terms and conditions of this Agreement and has taken and shall before completion of the Term take all necessary action to authorize the execution, delivery and performance of the terms and conditions of this Agreement.

6.2 The truth and correctness of all the matters stated in the representations and warranties under the foregoing clause 6.1 shall form the basis of the Parties' commitment to enter into this Agreement in accordance with the provisions under this Agreement. If any such representations or warranties shall at any time hereafter be found to have been incorrect in any material aspect, the Owner shall rectify the said breach within thirty (30) days from the date of receipt by Owner of a written request from the non-defaulting party or the non-defaulting party's Solicitors, as the case may be, requiring such rectification, failing which Clause 6A will apply.`
    },
    {
        id: 'termination',
        question: 'What are the termination terms?',
        answer: `6A.1 Termination by Owner before Lease Period

There shall be no termination throughout the repayment terms stated in Quotation at RenoXpert System. In the event, the Owner wishes to terminate this Agreement prior the full settlement of the contract sum due and payable to the Company, the Owner hereby undertake and agrees that all outstanding sum due and payable to the Company [including the monthly repayment within the stipulated period as described in the quotation at RenoXpert System] shall be fully settled by the Owner to the Company, failing which the Company shall be entitled to withhold the delivery of vacant possession for the Property. If any and/or all outstanding sum is not fully settled by the Owner within fourteen (14) working days after receipt of the written notice of Owner notifying his/her intention for termination, the Company shall be entitled to do or cause to do the necessary to recover the Balance Sum including but not limited to renting out of the Property, lodgment of caveat on the said Property and debt recovery by court action.

6A.2 Termination by Owner during Lease Period

In the event of early determination of this Agreement by the Owner without cause at any time within the Term or any of the renewal term(s), the Owner shall serve to the Company a prior written notice of not less than three (3) months, or a compensation of a sum equivalent to the aggregate of the three (3) months' gross revenue generated from the Property on full-occupancy basis in lieu of the 3-month written notice, irrespective of the actual occupancy rate of the Property at the time of termination PROVIDED ALWAYS that the Contract Sum due and payable to the Company has been fully settled by the Owner. Thereafter, this Agreement shall be deemed terminated and the parties shall have no further claims from each other save for antecedent breaches.

6A.3 Termination by Company

If the Company elects to terminate this Agreement due to breach of clause 6.1 or 6A.1 or 6A.2 by the Owner, the Company may terminate this Agreement immediately and demand the Owner to repay all sum owed and payable to the Company.`
    },
    {
        id: 'fees-charges',
        question: 'What are the fees, charges, and performance provisions?',
        answer: `7.1 Performance Review and Termination Right

7.1.1 The Owner reserves the right to review the terms of this Agreement after the sixth (6th) month from the commencement date hereunder. This review shall encompass an assessment of the Company's performance in achieving occupancy targets and fulfilling its obligations under this Agreement.

7.1.2 In the event that the Company fails to achieve a minimum occupancy rate of fifty percent (50%) of the Property for the first six (6) consecutive months, the Owner shall be entitled to terminate this Agreement with only two (2) months prior written notice, without any compensation whatsoever payable to the Company provided always that the Contract Sum owed by the Owner to the Company has been fully settled.

7.2 Zero Management Fees

The Company shall not impose any management fee on the Owner based on the rental revenue generated from the Property.

7.3 Marketing Fee

7.3.1 The Owner is obligated to pay a marketing fee to the Company in accordance with the specified tenure period and rate stipulated in the table provided in Item 13 of the First Schedule.

7.3.2 For clarity, this fee reflects the Company's strategic role in ensuring continuity of tenancy for the Property — including sourcing new tenants and facilitating renewals — as part of its overall rental optimization strategy.

7.4 Unit Inspection and Cleaning Fees

7.4.1 The Owner shall pay to the Company a monthly fixed sum for unit inspection and cleaning services, based on the number of rooms, as stipulated in Item 14 of the First Schedule. This fee covers ongoing operational upkeep, regular unit inspections, weekly cleaning or housekeeping services, and the supply of consumables such as trash bags and cleaning solutions.

7.4.2 The Unit Inspection and Cleaning Fees shall be payable by the Owner upon commencement of the first (1st) tenancy of the Property. For the avoidance of doubt, the weekly cleaning/ housekeeping services provided by the Company shall be in accordance with basic hygiene standards and tenantable conditions.

7.5 System and Payment Gateway Charges

7.5.1 The Owner shall pay to the Company a monthly fixed sum being the charges for the System and the Payment Gateway as stipulated in Item 14 of First Schedule.

7.5.2 For the avoidance of doubt, these charges are utilized for the initial setup of the payment gateway and ongoing payment charges incurred from the tenants' rental payment (i.e., e-wallet charges, FPX or IBG charges, credit or debit card charges, etc.) and the service and maintenance fee in respect of the System. The System and Payment Gateway Charges shall be payable by the Owner upon commencement of the first (1st) tenancy of the Property.

7.6 Repair and Maintenance Charges

7.6.1 The Owner hereby acknowledges and consents to the authorization for any repair and maintenance work below or at the rate of RM300.00 only to be carried out by the Company without seeking additional approval of the Owner. A quotation/invoice shall be provided to the Owner by the Company for any repair and maintenance exceeding RM300.00 and the approval of the Owner shall be obtained before commencement of any repair and maintenance work. In this regard, the Owner shall respond within three (3) business days upon the Company's notification, failing which such approval shall be deemed to have been granted by the Owner upon expiry of the aforesaid three (3) business days.

7.6.2 For the avoidance of doubt, all references to "repair and maintenance" under this Agreement shall include the purchase, replacement, upgrading, and enhancement of any fixtures, fittings, furniture, equipment, or facilities within the Unit/Room, as may be necessary or appropriate from time to time.

7.6.3 Notwithstanding to clause 7.6.1 above, the Company shall have the absolute discretion to instruct their appointed contractor to carry out the repair work that exceeded RM300.00 without obtaining consent of the Owner in the event of the occurrence of emergency incident such as burst pipe and or in situations where the Owner is unreachable.

7.6.4 If the Owner intends to elect his own appointed contractor for the aforesaid repair and maintenance work, the Owner shall inform the Company in writing and any appointment arrangement thereof shall be communicated with the Company two (2) working days in advance.

7.6.5 All repair and maintenance charges shall adhere to the Company's Preferential Maintenance Fee Schedule, established at approximately 10% below prevailing market rates but the Owner reserves the right to engage any external party(ies) for such purposes.

7.7 Other Charges

The Company shall be entitled to collect any further charges from the Owner from time to time with prior written notification to the Owner if there is any variation and/or amendment to the structure of the collaboration hereunder with the Landlord.`
    },
    {
        id: 'general-disclaimer',
        question: 'What are the general disclaimers?',
        answer: `8.1 Non-Partnership

The Parties hereby acknowledge that this Agreement is strictly for the purposes of collaboration as outlined herein. This Agreement does not establish a joint venture, partnership, or employment relationship between the Parties, or authorize either party to act as agent for the other, and neither party shall have the authority to act in the name or on behalf of or otherwise to bind the other in any way, including but not limited to the making of any representation or warranty, the assumption of any obligation or liability, except as expressly provided within the terms of this Agreement.

8.2 Investment Risk

Owner acknowledges that any and all graphs, charts, tables and brochures provided are merely for illustrative purposes. These materials are provided "as is" without any express or implied warranties or representations by the Company, and the Parties hereby agree that any past performance illustrated shall be used solely for reference.

8.3 Rental Rate

The Parties acknowledge and agree that the rental rate set forth is subject to periodic fluctuations based on current market conditions, demand, promotional events, and other economic factors.

8.4 Limitation of Liability

Neither Party shall be liable for any indirect, consequential, or punitive damages, including but not limited to loss of profits, revenue, or business opportunities, except where such liability arises from gross negligence, fraud, willful misconduct, or breach of statutory obligations under this Agreement.

8.5 Safety Disclaimer

The Owner hereby acknowledges that the Company does not guarantee nor warrant the safety, security, or condition of the Property or any occupants dwelling within. The Company shall not be liable for any injuries, theft, accidents, or safety-related issues unless such incidents are partly or wholly caused by the gross negligence or willful misconduct of the Company, its authorized representatives, servants, or agents.

8.6 Occupancy Rates

The Company and the Owner acknowledge that occupancy rates for the Property may fluctuate due to factors beyond the Company's control, including but not limited to the Property's location, seasonal holidays, rental fees, age group, government policies, Force Majeure events (such as natural disasters or pandemics), safety concerns, convenience of surrounding amenities, and overall rental trends for the particular area. The Company shall not be held liable or responsible for the occupancy rate or income resulting from these factors. The Owner agrees that these variables may affect the occupancy rates and rental performance.

8.7 No Offer or Solicitation

Nothing contained in this Agreement shall constitute tax, legal, insurance, or investment advice or serve as a recommendation of or an offer to buy, sell, or invest in any investment scheme, product, service, or instrument. Such an offer or solicitation may only be made through formal offering materials which include detailed discussions of the investment strategy and associated principal risk factors.`
    },
    {
        id: 'force-majeure',
        question: 'What is the force majeure clause?',
        answer: `If the Property or any part thereof shall be damaged or destroyed by fire or other risks, including but not limited to acts of God, natural disasters, pandemics, war, terrorism, civil disturbances, governmental actions, regulations or policies (including disease control measures or policies causing border closures, as well as any government-imposed restrictions related to holidays or festivals), labor strikes, power outages, or other unforeseeable circumstances ("Force Majeure Events"), such that the Property is rendered unfit for use (except where caused by the default or negligence of the Tenant or either Party's servants or agents), no Party shall be liable to the other for failure or delay in performing obligations under this Agreement, if such failure or delay is due to Force Majeure beyond their reasonable control.`
    },
    {
        id: 'utilities',
        question: 'What are the utilities terms?',
        answer: `Utility payments for electricity shall be collected from the tenant(s) and paid by the Company on behalf of the Owner to the respective utility service provider. The Owner shall not bear these charges, save for sewerage charges (e.g. Indah Water Konsortium) and any Wi-Fi or broadband subscription.`
    },
    {
        id: 'room-rates',
        question: 'What are the room rates and promotions terms?',
        answer: `The Company has the discretion to optimize room rates based on demand factors and promotional events to achieve the best balance of turnaround time, occupancy, and rental rate, including the grant of any rent-free period (if applicable). Regular fluctuations of room rates within ±10–20% fall within the Company's discretion. Any adjustment exceeding 20% shall be mutually agreed upon by both Parties.`
    },
    {
        id: 'authority-granted',
        question: 'What authority is granted to the company?',
        answer: `12.1 Owner's Right to Enter:

The Owner may enter the Property with at least five (5) working days' written notice, accompanied by a Company-authorized community leader, for the purpose of inspecting the Property's condition. Such inspections shall exclude any occupied rooms.

12.2 Absconding or Early Termination by Tenants:

The Owner authorizes the Company to pursue recovery of any outstanding rent or monies owed by tenants in the event of early termination or absconding. The Company may initiate legal action as it deems fit, and shall bear the costs and expenses of such action.`
    },
    {
        id: 'taxes',
        question: 'What are the tax provisions?',
        answer: `13.1 In the event that any new taxes are imposed by the government on charges or fees payable by the Owner to the Company or its contractors, the Owner shall bear such taxes as required under prevailing laws.

13.2 All fees, charges, or payments under this Agreement are subject to Sales and Service Tax (SST) in accordance with Malaysian laws. The Company reserves the right to impose SST as required by authorities, including the Royal Malaysian Customs Department and Inland Revenue Board. Such SST amounts shall be payable by the Owner and will be reflected in the Company's invoices.

13.3 The Owner agrees to pay all SST amounts as legally applicable, and acknowledges that the Company shall not be liable for any changes in tax law or enforcement practice that may affect the application of SST.`
    },
    {
        id: 'governing-law',
        question: 'What is the governing law and dispute resolution?',
        answer: `14.1 The conclusion, validity, interpretation and performance of this Agreement, as well as the dispute resolution under this Agreement shall be governed by the laws of Malaysia.

14.2 The Parties shall seek to resolve any dispute arising from the interpretation or performance of this Agreement through friendly consultation.

14.3 Failing such resolution, the Parties submit to the jurisdiction of the courts of Malaysia.

14.4 In the event of any legal proceedings arising from this Agreement, the defaulting party shall bear all legal costs incurred by the non-defaulting party.`
    },
    {
        id: 'confidentiality',
        question: 'What are the confidentiality provisions?',
        answer: `Both Parties shall maintain the confidentiality of all Confidential Information acquired under this Agreement, except where disclosure is required by law, regulatory authority, or to professional advisers for necessary performance of their duties.`
    },
    {
        id: 'severance',
        question: 'What is the severance clause?',
        answer: `If any provision of this Agreement is deemed unlawful, void, or unenforceable, such provision shall be severed and the remaining provisions shall remain valid and enforceable.`
    },
    {
        id: 'miscellaneous',
        question: 'What are the miscellaneous provisions?',
        answer: `(a) All tenancy agreements executed between the Company and tenants are assets of the Company, and all tenant information shall be kept confidential in line with the Company's Terms of Use and Privacy Policy.

(b) Any amounts payable by the Owner (e.g. contractor payments, Wi-Fi/broadband fees) may be deducted by the Company from the monthly rental revenue before disbursing the balance to the Owner.

(c) This Agreement shall be binding upon the heirs, beneficiaries, representatives, successors-in-title, and assigns of the Parties.

(d) This Agreement may be executed via digital or electronic signature, in accordance with the Electronic Commerce Act 2006, and shall be legally binding.

(e) No failure or delay in exercising any right under this Agreement shall constitute a waiver thereof.

(f) This Agreement constitutes the entire agreement between the Parties, superseding all prior agreements or understandings.

(g) If applicable, designated car park bay(s) of the Property shall only be rented to tenants or occupants of the Property, and not to third parties.

(h) The cost and incidental expenses of Tenancy Agreement preparation and stamping shall be borne fully by the Owner.`
    },
    {
        id: 'definitions',
        question: 'What are the definitions and interpretations?',
        answer: `18.1.1 "Working day" or "business day" means a day (excluding Saturdays and Sundays) when banks are open for business in Selangor, Kuala Lumpur, and the locality of the Property.

18.1.2 Terms like "herein", "hereinafter", etc., refer to this Agreement as a whole unless otherwise stated.

18.1.3 Legislative references include all modifications or re-enactments thereof.

18.1.4 "Writing" includes all comparable means of communication.

18.1.5 Time periods calculated from a specific day exclude that day.

18.1.6 Notices must be delivered by hand, courier, or email to the Parties' designated addresses.

18.1.7 Calendar references are to the Gregorian calendar.

18.1.8 "Confidential Information" includes proprietary data or knowledge not publicly known, disclosed by either Party in any form.`
    }
];

const FAQPage = () => {
    const { campaignSlug } = useParams<{ campaignSlug: string }>();

    const formatAnswer = (answer: string) => {
        return answer.split('\n\n').map((paragraph, index) => {
            if (paragraph.trim() === '') {
                return null;
            }
            return (
                <p key={index} className="mb-3 last:mb-0">
                    {paragraph.trim().split('\n').map((line, lineIndex) => (
                        <React.Fragment key={lineIndex}>
                            {line.trim()}
                            {lineIndex < paragraph.trim().split('\n').length - 1 && <br />}
                        </React.Fragment>
                    ))}
                </p>
            );
        }).filter(Boolean);
    };

    return (
        <div className='w-full h-max'>
            <div className="w-full h-full bg-gradient-to-br from-white via-gray-50 to-blue-50">
                {/* Header with Logo */}
                <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <img
                                    src="/app/RenoExpert_logo-01.svg"
                                    alt="RenoXpert Logo"
                                    className="h-8 sm:h-10 w-auto"
                                />
                                <div className="ml-3 sm:ml-4">
                                    <h1 className="text-base sm:text-lg font-semibold text-gray-900">FAQ</h1>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                    <div className="max-w-4xl mx-auto">
                        <Link
                            to={`/campaigns/${campaignSlug}`}
                            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors duration-200"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span>Back to Campaign</span>
                        </Link>

                        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg border border-gray-100">
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
                            
                            <div data-accordion="true">
                                {faqData.map((faq, index) => (
                                    <div 
                                        key={faq.id}
                                        className="accordion-item [&:not(:last-child)]:border-b border-b-gray-200" 
                                        data-accordion-item="true" 
                                        id={`faq_item_${index + 1}`}
                                    >
                                        <button 
                                            className="accordion-toggle py-4 group w-full text-left flex items-center justify-between" 
                                            data-accordion-toggle={`#faq_content_${index + 1}`}
                                        >
                                            <span className="text-base text-gray-900 font-medium pr-4">
                                                {faq.question}
                                            </span>
                                            <div className="flex-shrink-0">
                                                <i className="ki-outline ki-right text-gray-600 text-2sm accordion-active:hidden block"></i>
                                                <i className="ki-outline ki-down text-gray-600 text-2sm accordion-active:block hidden"></i>
                                            </div>
                                        </button>
                                        <div 
                                            className="accordion-content hidden" 
                                            id={`faq_content_${index + 1}`}
                                        >
                                            <div className="text-gray-700 text-md pb-4">
                                                {formatAnswer(faq.answer)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FAQPage;
